import { ExtractedWebsiteContent, NGOProfile } from "../../types";
import { llmService } from "../llm/provider";

const COMMON_THEMES = [
  "Education", "Healthcare", "Climate & Environment", "Gender Equality", "Girls' Education",
  "Poverty Alleviation", "Agriculture & Food Security", "Clean Water & Sanitation", "Human Rights",
  "Economic Opportunity", "Technology for Impact", "Youth Empowerment", "Community Resilience",
  "Child Protection", "Refugee & Migration", "Mental Health", "Civic Participation"
];

const COMMON_BENEFICIARIES = [
  "Women and Girls", "Children and Infants", "Youth and Adolescents", "Smallholder Farmers",
  "Rural Communities", "Indigenous Peoples", "Persons with Disabilities", "Refugees & Displaced Persons",
  "Low-Income Households", "Urban Poor", "Elderly"
];

const COMMON_COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Ghana", "Nigeria", "South Africa",
  "India", "Bangladesh", "Nepal", "Pakistan", "Philippines", "Indonesia", "Vietnam",
  "Colombia", "Peru", "Guatemala", "Brazil", "Mexico", "United States", "United Kingdom",
  "Canada", "Germany", "France", "Global"
];

/**
 * Heuristic fallback parser when no LLM key is configured.
 * Uses regex, taxonomy matching, and title/meta heuristics.
 */
export function extractNgoProfileHeuristically(content: ExtractedWebsiteContent): NGOProfile {
  const combinedText = `${content.title}\n${content.metaDescription || ""}\n${content.text}`.toLowerCase();

  // 1. Infer Name
  let name = content.title.split(/[-|–:]/)[0]?.trim() || "Organization";
  if (name.length > 50 || name.length < 2) {
    try {
      const parsedUrl = new URL(content.url);
      const hostParts = parsedUrl.hostname.replace("www.", "").split(".")[0];
      name = hostParts.charAt(0).toUpperCase() + hostParts.slice(1);
    } catch {
      name = "Civil Society Organization";
    }
  }

  // 2. Infer Description
  const description =
    content.metaDescription && content.metaDescription.length > 40
      ? content.metaDescription
      : content.text.slice(0, 300).replace(/\n+/g, " ").trim() + "...";

  // 3. Detect Countries & Regions
  const detectedCountries = COMMON_COUNTRIES.filter((c) =>
    new RegExp(`\\b${c.toLowerCase()}\\b`, "i").test(combinedText)
  );
  const country = detectedCountries[0] || "Global";
  const operating_regions = detectedCountries.length > 0 ? detectedCountries : ["Global"];

  // 4. Detect Themes
  const themes = COMMON_THEMES.filter((theme) =>
    combinedText.includes(theme.toLowerCase()) ||
    theme.toLowerCase().split(" ").some((w) => w.length > 4 && combinedText.includes(w))
  );

  // 5. Detect Beneficiaries
  const beneficiaries = COMMON_BENEFICIARIES.filter((b) =>
    combinedText.includes(b.toLowerCase()) ||
    b.toLowerCase().split(" ").some((w) => w.length > 4 && combinedText.includes(w))
  );

  // 6. Infer years operating from copyright or founded statements (e.g. "founded in 2018", "since 2015")
  let years_operating = 3;
  const currentYear = new Date().getFullYear();
  const foundedMatch = combinedText.match(/(?:founded|established|operating since|est\.)\s*(?:in\s*)?(19\d\d|20\d\d)/i);
  if (foundedMatch && foundedMatch[1]) {
    const foundedYear = parseInt(foundedMatch[1], 10);
    if (foundedYear >= 1950 && foundedYear <= currentYear) {
      years_operating = Math.max(1, currentYear - foundedYear);
    }
  }

  return {
    name,
    website: content.url,
    description,
    country,
    operating_regions: operating_regions.length > 0 ? operating_regions : ["Global"],
    themes: themes.length > 0 ? themes : ["Community Development", "Education"],
    beneficiaries: beneficiaries.length > 0 ? beneficiaries : ["Underserved Communities", "Youth"],
    annual_budget: 150000,
    requested_funding_min: 25000,
    requested_funding_max: 100000,
    years_operating,
    registration_status: "Registered Non-Profit",
  };
}

/**
 * Extracts structured NGO profile from crawled website text using LLM,
 * falling back to heuristic parsing if LLM is unavailable or errors out.
 */
export async function extractNgoProfileFromWebsite(content: ExtractedWebsiteContent): Promise<NGOProfile> {
  if (llmService.isDemoMode()) {
    return extractNgoProfileHeuristically(content);
  }

  const prompt = `You are an expert NGO evaluator. Extract structured organizational information from this NGO website text:

URL: ${content.url}
Title: ${content.title}
Meta Description: ${content.metaDescription || "None"}
Website Content Excerpt:
${content.text.slice(0, 7000)}

Return ONLY a JSON object with this exact structure:
{
  "name": "Organization Name",
  "description": "Concise 2-3 sentence overview of their core mission, activities, and approach.",
  "country": "Primary country of headquarters or primary operation",
  "operating_regions": ["List of specific countries or regions where they work"],
  "themes": ["List of 2-5 sector themes e.g. Education, Health, Climate & Environment, Gender Equality"],
  "beneficiaries": ["List of 2-4 target populations e.g. Women and Girls, Smallholder Farmers, Children"],
  "years_operating": 3,
  "registration_status": "Registered Non-Profit"
}`;

  try {
    const rawResponse = await llmService.complete(prompt, {
      system: "You are a specialized NGO researcher extracting accurate organizational metadata. Return valid JSON only.",
      json: true,
    });

    if (!rawResponse) {
      return extractNgoProfileHeuristically(content);
    }

    const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      name: parsed.name || content.title.split(/[-|–]/)[0]?.trim() || "Organization",
      website: content.url,
      description: parsed.description || content.metaDescription || "Civil society organization.",
      country: parsed.country || "Global",
      operating_regions: Array.isArray(parsed.operating_regions) && parsed.operating_regions.length > 0
        ? parsed.operating_regions
        : ["Global"],
      themes: Array.isArray(parsed.themes) && parsed.themes.length > 0
        ? parsed.themes
        : ["Community Development"],
      beneficiaries: Array.isArray(parsed.beneficiaries) && parsed.beneficiaries.length > 0
        ? parsed.beneficiaries
        : ["General Public"],
      annual_budget: 150000,
      requested_funding_min: 25000,
      requested_funding_max: 100000,
      years_operating: typeof parsed.years_operating === "number" ? parsed.years_operating : 3,
      registration_status: parsed.registration_status || "Registered Non-Profit",
    };
  } catch (err) {
    console.warn("LLM parsing error, falling back to heuristic parsing:", err);
    return extractNgoProfileHeuristically(content);
  }
}
