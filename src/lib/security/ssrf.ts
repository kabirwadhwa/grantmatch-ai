import dns from "dns/promises";
import net from "net";

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFError";
  }
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to a private, loopback,
 * link-local, or otherwise dangerous internal network range.
 */
export function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) {
    return false;
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [p0, p1] = parts;

    // 0.0.0.0/8 (Current network)
    if (p0 === 0) return true;

    // 10.0.0.0/8 (Private)
    if (p0 === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;

    // 169.254.0.0/16 (Link-local / Cloud metadata: 169.254.169.254)
    if (p0 === 169 && p1 === 254) return true;

    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (p0 === 192 && p1 === 168) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / TEST-NET)
    if (p0 === 192 && p1 === 0 && parts[2] === 2) return true;
    if (p0 === 198 && p1 === 51 && parts[2] === 100) return true;
    if (p0 === 203 && p1 === 0 && parts[2] === 113) return true;

    // 224.0.0.0/4 (Multicast) and 240.0.0.0/4 (Reserved)
    if (p0 >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();

    // Loopback ::1
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

    // Unspecified ::
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

    // IPv4-mapped IPv6 (::ffff:127.0.0.1 etc)
    if (normalized.startsWith("::ffff:")) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIp(ipv4Part);
      }
    }

    // Unique local address (fc00::/7 -> fc00 to fdff)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

    // Link-local address (fe80::/10 -> fe80 to febf)
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Validates a target URL string before any HTTP connection is attempted.
 * Throws SSRFError if the destination resolves to localhost or private IPs.
 */
export async function validateSafeUrl(rawUrl: string): Promise<URL> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new SSRFError("Invalid URL format");
  }

  // Allow only HTTP and HTTPS protocols
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new SSRFError(`Forbidden protocol: ${parsedUrl.protocol}. Only http and https are permitted.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Block obvious internal names
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan")
  ) {
    throw new SSRFError(`Access to internal hostname is blocked: ${hostname}`);
  }

  // If hostname is directly an IP, test immediately
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new SSRFError(`Access to private IP address is blocked: ${hostname}`);
    }
    return parsedUrl;
  }

  // Resolve hostname via DNS to verify resolved IP is public
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    for (const entry of lookupResult) {
      if (isPrivateIp(entry.address)) {
        throw new SSRFError(`Target host resolves to private/internal IP address: ${entry.address}`);
      }
    }
  } catch (err: unknown) {
    if (err instanceof SSRFError) throw err;
    // If DNS resolution fails, throw safe error
    throw new SSRFError(`Could not resolve host: ${hostname}`);
  }

  return parsedUrl;
}

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

/**
 * Safe fetch wrapper that enforces SSRF validation, redirects checking,
 * response timeout, and maximum download body size.
 */
export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 7000,
    maxBytes = 1.5 * 1024 * 1024, // 1.5 MB
    maxRedirects = 3,
    ...fetchOptions
  } = options;

  let currentUrl = rawUrl;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    const validatedUrl = await validateSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(validatedUrl.toString(), {
        ...fetchOptions,
        redirect: "manual", // Handle manually to validate each redirect for SSRF
        signal: controller.signal,
        headers: {
          "User-Agent": "GrantMatch-AI-Bot/1.0 (+https://grantmatch.ai)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeout);

      // Check if redirect
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new SSRFError("Redirect without Location header");
        }
        // Resolve relative redirects against current URL
        currentUrl = new URL(location, validatedUrl.toString()).toString();
        redirects++;
        continue;
      }

      // Check response length if content-length header is present
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxBytes) {
        throw new SSRFError(`Response exceeded maximum permitted size of ${maxBytes} bytes`);
      }

      return response;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof SSRFError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new SSRFError(`Request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  throw new SSRFError(`Too many redirects (max: ${maxRedirects})`);
}
