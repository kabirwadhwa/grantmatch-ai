import * as cheerio from "cheerio";
import { safeFetch } from "../security/ssrf";
import { ExtractedWebsiteContent } from "../../types";
import { getCachedUrlContent, setCachedUrlContent } from "../security/rate-limiter";

/**
 * Cleans an HTML document and extracts readable, dense text without boilerplate.
 */
export function cleanHtmlToText(html: string): { title: string; metaDescription: string; text: string; links: string[] } {
  const $ = cheerio.load(html);

  const title = $("title").text().trim() || "";
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  // Discover candidate subpage links before stripping tags
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) links.push(href);
  });

  // Remove elements that do not contain core semantic content
  $(
    "script, style, noscript, nav, header, footer, iframe, svg, [role='alert'], .cookie-banner, .footer, .header, #menu"
  ).remove();

  // Extract headings and paragraphs
  const contentPieces: string[] = [];

  $("h1, h2, h3, h4, p, li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 20) {
      contentPieces.push(text);
    }
  });

  const text = contentPieces.join("\n\n");
  return { title, metaDescription, text, links };
}

/**
 * Safely crawls an NGO website: starts with homepage, discovers key pages
 * (About, Mission, Programs, What We Do), and compiles high-signal text.
 */
export async function crawlNgoWebsite(rawUrl: string, maxPages = 4): Promise<ExtractedWebsiteContent> {
  const cached = getCachedUrlContent<ExtractedWebsiteContent>(rawUrl);
  if (cached) {
    return cached;
  }

  // Ensure protocol
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  const baseOrigin = new URL(targetUrl).origin;

  // 1. Fetch homepage
  const homeResp = await safeFetch(targetUrl, { timeoutMs: 6000 });
  if (!homeResp.ok) {
    throw new Error(`Failed to fetch homepage: HTTP status ${homeResp.status}`);
  }

  const homeHtml = await homeResp.text();
  const { title, metaDescription, text: homeText, links } = cleanHtmlToText(homeHtml);

  // 2. Identify candidate subpages (/about, /programs, /mission, /projects, /what-we-do)
  const candidateKeywords = ["about", "mission", "program", "what-we-do", "project", "work", "impact"];
  const subpageUrlsToVisit = new Set<string>();

  for (const rawLink of links) {
    try {
      const resolved = new URL(rawLink, targetUrl);
      // Stay on same domain, avoid anchors/mailtos/tel/images/pdf
      if (
        resolved.origin === baseOrigin &&
        resolved.pathname !== "/" &&
        !resolved.pathname.endsWith(".pdf") &&
        !resolved.pathname.endsWith(".jpg") &&
        !resolved.pathname.endsWith(".png")
      ) {
        const lowerPath = resolved.pathname.toLowerCase();
        if (candidateKeywords.some((keyword) => lowerPath.includes(keyword))) {
          subpageUrlsToVisit.add(resolved.toString());
          if (subpageUrlsToVisit.size >= maxPages - 1) break;
        }
      }
    } catch {
      // Ignore invalid link
    }
  }

  // 3. Fetch up to (maxPages - 1) subpages concurrently with safe timeouts
  const pageTexts: string[] = [homeText];
  let pagesCrawled = 1;

  await Promise.all(
    Array.from(subpageUrlsToVisit).map(async (subUrl) => {
      try {
        const resp = await safeFetch(subUrl, { timeoutMs: 5000 });
        if (resp.ok) {
          const html = await resp.text();
          const parsed = cleanHtmlToText(html);
          if (parsed.text.length > 50) {
            pageTexts.push(`--- Page: ${subUrl} ---\n${parsed.text}`);
            pagesCrawled++;
          }
        }
      } catch {
        // Individual subpage crawl failures should not fail the overall extraction
      }
    })
  );

  const combinedText = pageTexts.join("\n\n").slice(0, 25000); // Keep within reasonable context size

  const result: ExtractedWebsiteContent = {
    url: targetUrl,
    title,
    metaDescription,
    headings: [],
    text: combinedText,
    pagesCrawled,
  };

  setCachedUrlContent(rawUrl, result);
  return result;
}
