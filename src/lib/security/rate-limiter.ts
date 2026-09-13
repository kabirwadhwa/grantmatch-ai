interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store
const ipRateLimits = new Map<string, RateLimitRecord>();

// In-memory cache for parsed URLs and grant search results
const parsedUrlCache = new Map<string, { data: unknown; expiresAt: number }>();
const searchResultCache = new Map<string, { data: unknown; expiresAt: number }>();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const limitPerDay = parseInt(process.env.RATE_LIMIT_PER_DAY || "3", 10);
  const now = Date.now();

  let record = ipRateLimits.get(ip);

  // If no record or current window expired, reset window
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + ONE_DAY_MS,
    };
    ipRateLimits.set(ip, record);
  }

  if (record.count >= limitPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limitPerDay - record.count,
    resetTime: record.resetTime,
  };
}

// Cached URL getter / setter
export function getCachedUrlContent<T>(url: string): T | null {
  const entry = parsedUrlCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    parsedUrlCache.delete(url);
    return null;
  }
  return entry.data as T;
}

export function setCachedUrlContent(url: string, data: unknown, ttlMs: number = ONE_HOUR_MS * 6): void {
  parsedUrlCache.set(url, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

// Search result cache
export function getCachedSearchResults<T>(cacheKey: string): T | null {
  const entry = searchResultCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchResultCache.delete(cacheKey);
    return null;
  }
  return entry.data as T;
}

export function setCachedSearchResults(cacheKey: string, data: unknown, ttlMs: number = ONE_HOUR_MS * 4): void {
  searchResultCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}
