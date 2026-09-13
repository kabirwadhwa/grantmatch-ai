import { prisma } from "../prisma";
import { GrantOpportunity, NGOProfile } from "../../types";
import { getSearchProvider } from "./providers/factory";
import { generateDiscoveryQueries } from "./query-generator";
import { safeFetch } from "../security/ssrf";
import { extractGrantFromPage } from "../scraper/grant-extractor";

// Helper to normalize and canonicalize URLs to eliminate duplicates
export function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.hash = "";
    // Remove common tracking / session parameters
    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower.startsWith("fbclid") ||
        lower.startsWith("gclid") ||
        ["ref", "source", "trk", "campaign"].includes(lower)
      ) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach((k) => parsed.searchParams.delete(k));

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

// Check if a URL belongs to a known aggregator, social media, or job board
export function isBlacklistedDomain(domain: string): boolean {
  const lower = domain.toLowerCase();
  const blacklist = [
    "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
    "youtube.com", "wikipedia.org", "pinterest.com", "reddit.com",
    "tiktok.com", "glassdoor.com", "indeed.com"
  ];
  return blacklist.some((blocked) => lower.includes(blocked));
}

export interface DiscoveryResult {
  queriesRun: string[];
  urlsEvaluated: number;
  newGrantsDiscovered: number;
  discoveredGrants: GrantOpportunity[];
}

export async function runLiveDiscoveryPipeline(
  ngo: NGOProfile,
  ngoId?: string
): Promise<DiscoveryResult> {
  const searchProvider = getSearchProvider();
  const queries = generateDiscoveryQueries(ngo);
  const maxUrlsPerDiscovery = parseInt(process.env.MAX_URLS_PER_DISCOVERY || "20", 10);

  const candidateUrls = new Map<string, { title: string; snippet: string }>();

  // 1. Run generated queries
  for (const query of queries) {
    try {
      const results = await searchProvider.search(query, { limit: 5 });
      for (const res of results) {
        const canonical = canonicalizeUrl(res.url);
        if (isBlacklistedDomain(res.sourceDomain)) continue;
        if (!candidateUrls.has(canonical)) {
          candidateUrls.set(canonical, { title: res.title, snippet: res.snippet });
        }
        if (candidateUrls.size >= maxUrlsPerDiscovery) break;
      }
    } catch (err) {
      console.warn(`Search error for query "${query}":`, err);
    }
    if (candidateUrls.size >= maxUrlsPerDiscovery) break;
  }

  // 2. Filter out URLs already stored in database
  const uniqueUrls = Array.from(candidateUrls.keys());
  const existingRecords = await prisma.grant.findMany({
    where: { url: { in: uniqueUrls } },
    select: { url: true },
  });
  const existingSet = new Set(existingRecords.map((r) => r.url));
  const newUrlsToScrape = uniqueUrls.filter((url) => !existingSet.has(url));

  const newlyDiscovered: GrantOpportunity[] = [];

  // 3. Scrape and extract grants from new candidate pages
  for (const targetUrl of newUrlsToScrape) {
    try {
      const resp = await safeFetch(targetUrl, { timeoutMs: 6000 });
      if (!resp.ok) continue;

      const html = await resp.text();
      const extractedGrant = await extractGrantFromPage(html, targetUrl);

      if (extractedGrant) {
        // Save to database
        const saved = await prisma.grant.create({
          data: {
            title: extractedGrant.title,
            funder: extractedGrant.funder,
            url: extractedGrant.url,
            description: extractedGrant.description,
            funding_min: extractedGrant.funding_min,
            funding_max: extractedGrant.funding_max,
            currency: extractedGrant.currency,
            deadline: extractedGrant.deadline ? new Date(extractedGrant.deadline) : null,
            eligible_regions: JSON.stringify(extractedGrant.eligible_regions),
            eligible_org_types: JSON.stringify(extractedGrant.eligible_org_types),
            themes: JSON.stringify(extractedGrant.themes),
            beneficiaries: JSON.stringify(extractedGrant.beneficiaries),
            requirements: JSON.stringify(extractedGrant.requirements),
            operating_history_required: extractedGrant.operating_history_required,
            source_domain: extractedGrant.source_domain,
            status: extractedGrant.status,
          },
        });

        newlyDiscovered.push({
          id: saved.id,
          title: saved.title,
          funder: saved.funder,
          url: saved.url,
          description: saved.description,
          funding_min: saved.funding_min,
          funding_max: saved.funding_max,
          currency: saved.currency,
          deadline: saved.deadline,
          eligible_regions: JSON.parse(saved.eligible_regions),
          eligible_org_types: JSON.parse(saved.eligible_org_types),
          themes: JSON.parse(saved.themes),
          beneficiaries: JSON.parse(saved.beneficiaries),
          requirements: JSON.parse(saved.requirements),
          operating_history_required: saved.operating_history_required,
          source_domain: saved.source_domain,
          status: saved.status as any,
          discovered_at: saved.discovered_at,
          last_checked_at: saved.last_checked_at,
        });
      }
    } catch (err) {
      // Skip unreachable pages or SSRF violations safely
      console.warn(`Could not process candidate grant URL ${targetUrl}:`, err);
    }
  }

  // 4. Log the search run
  try {
    await prisma.searchRun.create({
      data: {
        ngo_id: ngoId || null,
        query: queries.slice(0, 3).join(" | "),
        provider: searchProvider.name,
        number_results: newlyDiscovered.length,
      },
    });
  } catch (err) {
    console.warn("Error logging search run:", err);
  }

  return {
    queriesRun: queries,
    urlsEvaluated: uniqueUrls.length,
    newGrantsDiscovered: newlyDiscovered.length,
    discoveredGrants: newlyDiscovered,
  };
}
