/**
 * Canonical display-name layer for grant funders.
 * Resolves internal slugs, scraped domain stems, and heuristic names into
 * clean, human-readable institutional names without altering underlying database keys.
 */

const KNOWN_FUNDER_MAP: Record<string, string> = {
  // MacArthur
  "macfound.org": "MacArthur Foundation",
  "macfound": "MacArthur Foundation",
  "macfound foundation": "MacArthur Foundation",
  "john d. and catherine t. macarthur foundation": "MacArthur Foundation",
  
  // Oak
  "oakfnd.org": "Oak Foundation",
  "oakfnd": "Oak Foundation",
  "oakfnd foundation": "Oak Foundation",
  
  // Ford
  "fordfoundation.org": "Ford Foundation",
  "fordfoundation": "Ford Foundation",
  "fordfoundation foundation": "Ford Foundation",
  
  // Global Innovation Fund
  "globalinnovation.fund": "Global Innovation Fund",
  "globalinnovation": "Global Innovation Fund",
  "globalinnovation foundation": "Global Innovation Fund",
  
  // Climate Justice Resilience Fund
  "cjrfund.org": "Climate Justice Resilience Fund",
  "cjrfund": "Climate Justice Resilience Fund",
  "cjrfund foundation": "Climate Justice Resilience Fund",
  
  // Wellcome Trust
  "wellcome.org": "Wellcome Trust",
  "wellcome": "Wellcome Trust",
  "wellcome foundation": "Wellcome Trust",
  
  // Google.org
  "impactchallenge.withgoogle.com": "Google.org",
  "google.org": "Google.org",
  "impactchallenge": "Google.org",
  "impactchallenge foundation": "Google.org",
  
  // European Commission
  "international-partnerships.ec.europa.eu": "European Commission (DG INTPA)",
  "ec.europa.eu": "European Commission",
  "european commission (dg intpa)": "European Commission (DG INTPA)",
  "dg intpa": "European Commission (DG INTPA)",
  
  // USAID
  "usaid.gov": "USAID",
  "usaid": "USAID",
  "united states agency for international development (usaid)": "USAID",
  
  // Gates
  "gatesfoundation.org": "Bill & Melinda Gates Foundation",
  "gatesfoundation": "Bill & Melinda Gates Foundation",
  
  // Rockefeller
  "rockefellerfoundation.org": "Rockefeller Foundation",
  "rockefellerfoundation": "Rockefeller Foundation",
  
  // Open Society
  "opensocietyfoundations.org": "Open Society Foundations",
  "opensociety": "Open Society Foundations",
  
  // Skoll
  "skoll.org": "Skoll Foundation",
  "skoll": "Skoll Foundation",
  
  // Hewlett
  "hewlett.org": "William and Flora Hewlett Foundation",
  "hewlett": "William and Flora Hewlett Foundation",
  
  // Packard
  "packard.org": "David and Lucile Packard Foundation",
  "packard": "David and Lucile Packard Foundation",
};

/**
 * Returns the human-readable canonical name for a funder or source domain.
 */
export function getCanonicalFunderName(
  rawFunder?: string | null,
  sourceDomain?: string | null,
  url?: string | null
): string {
  let domain = sourceDomain;
  if (!domain && url) {
    try {
      domain = new URL(url).hostname;
    } catch {
      // ignore
    }
  }

  if (!rawFunder && !domain) {
    return "Institutional Funder";
  }

  // 1. Try matching against source domain
  if (domain) {
    const domainKey = domain.toLowerCase().replace(/^www\./, "").trim();
    if (KNOWN_FUNDER_MAP[domainKey]) {
      return KNOWN_FUNDER_MAP[domainKey];
    }
  }

  const funderText = (rawFunder || "").trim();
  const lowerFunder = funderText.toLowerCase();

  // 2. Try matching normalized funder string directly
  if (KNOWN_FUNDER_MAP[lowerFunder]) {
    return KNOWN_FUNDER_MAP[lowerFunder];
  }

  // 3. Partial check for known roots
  for (const [key, canonical] of Object.entries(KNOWN_FUNDER_MAP)) {
    if (lowerFunder === key || lowerFunder.startsWith(key) || (key.length > 5 && lowerFunder.includes(key))) {
      return canonical;
    }
  }

  // 4. Cleanup heuristic formatting (e.g. remove duplicate "Foundation Foundation", clean slugs)
  let cleaned = funderText
    .replace(/\bFoundation\s+Foundation\b/gi, "Foundation")
    .replace(/\bTrust\s+Trust\b/gi, "Trust")
    .replace(/\bFund\s+Fund\b/gi, "Fund")
    .replace(/[-_]+/g, " ")
    .trim();

  // If ends with generic slug like "org" or "com", strip
  cleaned = cleaned.replace(/\s+(org|com|net|gov)$/i, "");

  return cleaned || "Institutional Funder";
}
