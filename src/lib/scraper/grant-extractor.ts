import { GrantOpportunity } from "../../types";
import { llmService } from "../llm/provider";
import { cleanHtmlToText } from "./website-parser";

/**
 * Deterministic heuristic extractor for grant pages when LLM is unavailable.
 */
export function extractGrantHeuristically(html: string, url: string): GrantOpportunity | null {
  const { title, metaDescription, text } = cleanHtmlToText(html);
  const combined = `${title}\n${metaDescription}\n${text}`;
  const lower = combined.toLowerCase();

  // Basic check: Does this page talk about funding, grants, or call for proposals?
  const fundingKeywords = ["grant", "funding", "award", "call for proposals", "fellowship", "financial support", "request for proposals"];
  const matchesFunding = fundingKeywords.some((kw) => lower.includes(kw));
  if (!matchesFunding) {
    return null;
  }

  // Funder extraction from domain or title
  let funder = "Institutional Funder";
  let sourceDomain = "";
  try {
    const urlObj = new URL(url);
    sourceDomain = urlObj.hostname.replace("www.", "");
    const parts = sourceDomain.split(".");
    funder = parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + " Foundation";
  } catch {
    sourceDomain = "funder.org";
  }

  const cleanTitle = title.split(/[-|–:]/)[0]?.trim() || "Grant Opportunity";

  // Funding amount extraction (e.g. $50,000 to $250,000, up to $100,000)
  let funding_min: number | null = null;
  let funding_max: number | null = null;

  const rangeMatch = combined.match(/\$(\d{1,3}(?:,\d{3})+)\s*(?:to|-|–)\s*\$(\d{1,3}(?:,\d{3})+)/i);
  if (rangeMatch) {
    funding_min = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
    funding_max = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
  } else {
    const upToMatch = combined.match(/(?:up to|maximum of|grants of|awards of)\s*\$(\d{1,3}(?:,\d{3})+)/i);
    if (upToMatch) {
      funding_max = parseInt(upToMatch[1].replace(/,/g, ""), 10);
    }
  }

  // Deadline extraction (check for patterns like "Deadline: MM/DD/YYYY" or "Month Day, Year")
  let deadline: Date | null = null;
  const deadlineMatch = combined.match(/(?:deadline|closing date|applications due|due date)[:\s]*([A-Z][a-z]+\s+\d{1,2},?\s+202[5-9]|\d{1,2}\/\d{1,2}\/202[5-9])/i);
  if (deadlineMatch && deadlineMatch[1]) {
    const parsed = new Date(deadlineMatch[1]);
    if (!isNaN(parsed.getTime())) {
      deadline = parsed;
    }
  }

  // Check if clearly expired
  if (deadline && deadline.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    // Expired
    return null;
  }

  return {
    title: cleanTitle,
    funder,
    url,
    description: metaDescription || text.slice(0, 300).replace(/\s+/g, " ") + "...",
    funding_min,
    funding_max,
    currency: "USD",
    deadline,
    eligible_regions: ["Global", "Developing Countries"],
    eligible_org_types: ["Non-Profit", "NGO", "Community-Based Organization (CBO)"],
    themes: ["Community Development", "Education", "Healthcare"],
    beneficiaries: ["Underserved Communities", "Women and Girls", "Youth"],
    requirements: ["Valid legal registration", "Financial accountability"],
    operating_history_required: 1,
    source_domain: sourceDomain,
    status: "needs_verification",
  };
}

/**
 * Extracts structured grant fields from HTML content using LLM with fallback.
 */
export async function extractGrantFromPage(html: string, url: string): Promise<GrantOpportunity | null> {
  const { title, metaDescription, text } = cleanHtmlToText(html);

  if (llmService.isDemoMode()) {
    return extractGrantHeuristically(html, url);
  }

  const prompt = `You are a grant intelligence analyst. Analyze this web page and extract structured grant funding opportunity details.

URL: ${url}
Page Title: ${title}
Meta Description: ${metaDescription}
Page Text:
${text.slice(0, 7000)}

Instructions:
1. If this page is NOT an active grant, funding call, or award opportunity, return {"isValidGrant": false}.
2. If it is a valid grant, extract all available criteria.
3. Do NOT hallucinate deadlines or amounts. If not specified, set null.
4. If deadline is clearly in the past, note it.

Return ONLY a JSON object:
{
  "isValidGrant": true,
  "title": "Grant Title",
  "funder": "Funder Name",
  "description": "2-3 sentence overview of this funding opportunity",
  "funding_min": 50000,
  "funding_max": 200000,
  "currency": "USD",
  "deadline": "YYYY-MM-DD or null if rolling/unspecified",
  "eligible_regions": ["Global", "Kenya", "Sub-Saharan Africa"],
  "eligible_org_types": ["Non-Profit", "NGO", "Community-Based Organization (CBO)"],
  "themes": ["Education", "Climate", "Gender Equality"],
  "beneficiaries": ["Women and Girls", "Youth", "Smallholder Farmers"],
  "requirements": ["Audited financial accounts", "Valid non-profit registration"],
  "operating_history_required": 2
}`;

  try {
    const rawResponse = await llmService.complete(prompt, {
      system: "Extract grant criteria with high factual precision. Return valid JSON only.",
      json: true,
      temperature: 0.1,
    });

    if (!rawResponse) {
      return extractGrantHeuristically(html, url);
    }

    const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.isValidGrant) {
      return null;
    }

    let parsedDeadline: Date | null = null;
    if (parsed.deadline && parsed.deadline !== "null") {
      const d = new Date(parsed.deadline);
      if (!isNaN(d.getTime())) {
        if (d.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
          // Grant expired
          return null;
        }
        parsedDeadline = d;
      }
    }

    let sourceDomain = "";
    try {
      sourceDomain = new URL(url).hostname.replace("www.", "");
    } catch {
      sourceDomain = "source.org";
    }

    return {
      title: parsed.title || title || "Grant Opportunity",
      funder: parsed.funder || sourceDomain,
      url,
      description: parsed.description || metaDescription || "Grant funding opportunity.",
      funding_min: typeof parsed.funding_min === "number" ? parsed.funding_min : null,
      funding_max: typeof parsed.funding_max === "number" ? parsed.funding_max : null,
      currency: parsed.currency || "USD",
      deadline: parsedDeadline,
      eligible_regions: Array.isArray(parsed.eligible_regions) ? parsed.eligible_regions : ["Global"],
      eligible_org_types: Array.isArray(parsed.eligible_org_types) ? parsed.eligible_org_types : ["Non-Profit", "NGO"],
      themes: Array.isArray(parsed.themes) ? parsed.themes : ["Civil Society"],
      beneficiaries: Array.isArray(parsed.beneficiaries) ? parsed.beneficiaries : ["General"],
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      operating_history_required: typeof parsed.operating_history_required === "number" ? parsed.operating_history_required : null,
      source_domain: sourceDomain,
      status: "verified",
    };
  } catch (err) {
    console.warn("LLM grant extraction error, falling back to heuristic:", err);
    return extractGrantHeuristically(html, url);
  }
}
