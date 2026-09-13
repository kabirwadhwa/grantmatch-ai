import { NextRequest, NextResponse } from "next/server";
import { crawlNgoWebsite } from "@/lib/scraper/website-parser";
import { extractNgoProfileFromWebsite } from "@/lib/scraper/ngo-extractor";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { SSRFError } from "@/lib/security/ssrf";
import { llmService } from "@/lib/llm/provider";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Daily rate limit reached (3 searches/extractions per IP per day in public free tier).",
          resetTime: new Date(rateCheck.resetTime).toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "NGO website URL is required." }, { status: 400 });
    }

    // Crawl website with SSRF protection
    const crawledContent = await crawlNgoWebsite(url, 4);

    // Extract structured profile
    const profile = await extractNgoProfileFromWebsite(crawledContent);

    return NextResponse.json({
      success: true,
      profile,
      pagesCrawled: crawledContent.pagesCrawled,
      isDemoMode: llmService.isDemoMode(),
      llmProvider: llmService.getProviderDisplayName(),
    });
  } catch (err: unknown) {
    console.error("NGO Extraction error:", err);
    if (err instanceof SSRFError) {
      return NextResponse.json({ error: `Security check failed: ${err.message}` }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to extract NGO profile from website.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
