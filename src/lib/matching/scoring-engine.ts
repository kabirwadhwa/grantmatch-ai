import { GrantOpportunity, MatchEvaluation, NGOProfile, ScoreBreakdown } from "../../types";

// Taxonomy alias groupings for intelligent semantic matching
const THEME_SYNONYMS: Record<string, string[]> = {
  education: ["education", "schooling", "stem", "literacy", "pedagogy", "training", "learning", "skills"],
  health: ["healthcare", "health", "medical", "disease", "maternal", "nutrition", "mental health", "sanitation", "public health"],
  climate: ["climate", "environment", "resilience", "biodiversity", "conservation", "energy", "renewable", "carbon", "loss & damage"],
  gender: ["gender", "women", "girls", "female", "feminist", "equity", "empowerment"],
  poverty: ["poverty", "economic", "livelihoods", "microfinance", "income", "social protection", "inclusion"],
  human_rights: ["human rights", "justice", "civic", "democracy", "transparency", "governance", "advocacy", "rule of law"],
  agriculture: ["agriculture", "farming", "food security", "crops", "smallholder", "nutrition", "rural"],
  technology: ["technology", "digital", "data", "innovation", "artificial intelligence", "tech for good", "software"],
};

const REGION_HIERARCHIES: Record<string, string[]> = {
  kenya: ["east africa", "sub-saharan africa", "africa", "developing countries", "low-income countries"],
  uganda: ["east africa", "sub-saharan africa", "africa", "developing countries", "low-income countries"],
  tanzania: ["east africa", "sub-saharan africa", "africa", "developing countries", "low-income countries"],
  rwanda: ["east africa", "sub-saharan africa", "africa", "developing countries", "low-income countries"],
  ethiopia: ["east africa", "sub-saharan africa", "africa", "developing countries", "low-income countries"],
  ghana: ["west africa", "sub-saharan africa", "africa", "developing countries"],
  nigeria: ["west africa", "sub-saharan africa", "africa", "developing countries"],
  india: ["south asia", "asia", "asia-pacific", "developing countries"],
  bangladesh: ["south asia", "asia", "asia-pacific", "developing countries", "low-income countries"],
  peru: ["latin america", "south america", "americas", "developing countries"],
  colombia: ["latin america", "south america", "americas", "developing countries"],
  brazil: ["latin america", "south america", "americas", "developing countries"],
};

export function calculateThematicScore(ngoThemes: string[], grantThemes: string[]): number {
  if (!grantThemes || grantThemes.length === 0) return 75;
  if (!ngoThemes || ngoThemes.length === 0) return 50;

  const normalizedNgo = ngoThemes.map((t) => t.toLowerCase().trim());
  const normalizedGrant = grantThemes.map((t) => t.toLowerCase().trim());

  let matches = 0;
  for (const nTheme of normalizedNgo) {
    // Check direct equality
    if (normalizedGrant.some((gTheme) => gTheme.includes(nTheme) || nTheme.includes(gTheme))) {
      matches += 1.5;
      continue;
    }

    // Check synonym group matches
    for (const group of Object.values(THEME_SYNONYMS)) {
      const ngoMatchesGroup = group.some((keyword) => nTheme.includes(keyword));
      if (ngoMatchesGroup) {
        const grantMatchesGroup = normalizedGrant.some((gTheme) =>
          group.some((keyword) => gTheme.includes(keyword))
        );
        if (grantMatchesGroup) {
          matches += 1.0;
          break;
        }
      }
    }
  }

  const denominator = Math.max(1, Math.min(ngoThemes.length, grantThemes.length));
  const ratio = Math.min(1.0, matches / denominator);

  return Math.round(Math.max(20, ratio * 100));
}

export function calculateGeographicScore(
  ngoCountry: string,
  ngoOperatingRegions: string[],
  grantEligibleRegions: string[]
): number {
  if (!grantEligibleRegions || grantEligibleRegions.length === 0) return 75;

  const normalizedGrantRegions = grantEligibleRegions.map((r) => r.toLowerCase().trim());
  const normalizedCountry = (ngoCountry || "").toLowerCase().trim();
  const normalizedOperating = (ngoOperatingRegions || []).map((r) => r.toLowerCase().trim());

  // 1. Check if grant is explicitly Global / Worldwide / All Low-Middle Income
  const isGlobalGrant = normalizedGrantRegions.some((r) =>
    ["global", "worldwide", "all countries", "any country", "developing countries", "low- and middle-income"].some((kw) =>
      r.includes(kw)
    )
  );

  // 2. Check exact country match
  const hasExactCountry = normalizedGrantRegions.some((r) => r.includes(normalizedCountry) || normalizedCountry.includes(r));
  if (hasExactCountry && normalizedCountry !== "") {
    return 100;
  }

  // 3. Check operating regions exact overlap
  const hasOperatingOverlap = normalizedOperating.some((op) =>
    normalizedGrantRegions.some((r) => r.includes(op) || op.includes(r))
  );
  if (hasOperatingOverlap) {
    return 95;
  }

  // 4. Check hierarchical region mapping (e.g. Kenya -> East Africa -> Sub-Saharan Africa)
  const parents = REGION_HIERARCHIES[normalizedCountry] || [];
  const matchesHierarchy = parents.some((parent) =>
    normalizedGrantRegions.some((r) => r.includes(parent))
  );
  if (matchesHierarchy) {
    return 85;
  }

  // 5. If grant is global
  if (isGlobalGrant) {
    return 80;
  }

  // 6. Otherwise: completely outside eligible geographical zone
  return 0;
}

export function calculateEligibilityScore(
  ngo: NGOProfile,
  grant: GrantOpportunity
): { score: number; issues: string[] } {
  let score = 100;
  const issues: string[] = [];

  // Check operating history requirements
  if (grant.operating_history_required != null && grant.operating_history_required > 0) {
    const years = ngo.years_operating ?? 1;
    if (years < grant.operating_history_required) {
      score -= 35;
      issues.push(
        `Funder mandates at least ${grant.operating_history_required} years of operational history; your profile indicates ${years} year(s).`
      );
    }
  }

  // Check registration status
  const regStatus = (ngo.registration_status || "").toLowerCase();
  const grantOrgTypes = (grant.eligible_org_types || []).map((t) => t.toLowerCase());

  if (regStatus.includes("pending")) {
    score -= 30;
    issues.push("Organization registration is pending; many funders require completed legal non-profit status at submission.");
  }

  if (grantOrgTypes.length > 0) {
    const isMatchedType = grantOrgTypes.some((type) => {
      if (type.includes("non-profit") || type.includes("ngo")) {
        return regStatus.includes("non-profit") || regStatus.includes("ngo") || regStatus.includes("charit");
      }
      if (type.includes("cbo") || type.includes("community-based")) {
        return regStatus.includes("cbo") || regStatus.includes("community");
      }
      return true;
    });

    if (!isMatchedType) {
      score -= 25;
      issues.push(`Eligible entity types are [${grant.eligible_org_types.join(", ")}]; check legal fit for '${ngo.registration_status}'.`);
    }
  }

  // Check specific requirements strings for audit / fiscal rules
  if (grant.requirements && grant.requirements.length > 0) {
    for (const req of grant.requirements) {
      const lowerReq = req.toLowerCase();
      if (lowerReq.includes("audited") && (ngo.years_operating ?? 1) < 2) {
        issues.push("Funder expects audited financial statements for prior fiscal years.");
      }
    }
  }

  return {
    score: Math.max(10, Math.min(100, score)),
    issues,
  };
}

export function calculateFundingScore(
  ngo: NGOProfile,
  grant: GrantOpportunity
): { score: number; issues: string[] } {
  let score = 90;
  const issues: string[] = [];

  const grantMin = grant.funding_min || 0;
  const grantMax = grant.funding_max || Number.MAX_SAFE_INTEGER;
  const ngoRequestedMin = ngo.requested_funding_min || 0;
  const ngoRequestedMax = ngo.requested_funding_max || 100000;

  // Check overlap between requested range and grant range
  const hasOverlap = Math.max(grantMin, ngoRequestedMin) <= Math.min(grantMax, ngoRequestedMax);

  if (!hasOverlap) {
    if (ngoRequestedMin > grantMax && grantMax < Number.MAX_SAFE_INTEGER) {
      score = 45;
      issues.push(
        `Requested funding ($${ngoRequestedMax.toLocaleString()}) exceeds maximum grant cap ($${grantMax.toLocaleString()}).`
      );
    } else if (ngoRequestedMax < grantMin) {
      score = 60;
      issues.push(
        `Requested funding ($${ngoRequestedMax.toLocaleString()}) is below the minimum grant floor ($${grantMin.toLocaleString()}).`
      );
    }
  } else {
    score = 95;
  }

  // Absorptive capacity check: grant max vs annual budget
  if (ngo.annual_budget && grantMax < Number.MAX_SAFE_INTEGER && grantMax > ngo.annual_budget * 2.5) {
    issues.push(
      `Grant size ($${grantMax.toLocaleString()}) exceeds 2.5x your annual operating budget ($${ngo.annual_budget.toLocaleString()}); funders may scrutinize absorptive capacity.`
    );
    score = Math.max(50, score - 15);
  }

  return {
    score: Math.max(20, Math.min(100, score)),
    issues,
  };
}

export function calculateBeneficiaryScore(
  ngoBeneficiaries: string[],
  grantBeneficiaries: string[]
): number {
  if (!grantBeneficiaries || grantBeneficiaries.length === 0) return 75;
  if (!ngoBeneficiaries || ngoBeneficiaries.length === 0) return 50;

  const normalizedNgo = ngoBeneficiaries.map((b) => b.toLowerCase().trim());
  const normalizedGrant = grantBeneficiaries.map((b) => b.toLowerCase().trim());

  let matches = 0;
  for (const nBen of normalizedNgo) {
    if (normalizedGrant.some((gBen) => gBen.includes(nBen) || nBen.includes(gBen))) {
      matches += 1.5;
    } else {
      // Check partial token overlap
      const tokens = nBen.split(" ").filter((t) => t.length > 3);
      if (tokens.some((token) => normalizedGrant.some((gBen) => gBen.includes(token)))) {
        matches += 0.75;
      }
    }
  }

  const ratio = Math.min(1.0, matches / Math.max(1, Math.min(ngoBeneficiaries.length, grantBeneficiaries.length)));
  return Math.round(Math.max(25, ratio * 100));
}

/**
 * Executes complete multi-factor deterministic scoring and returns full breakdown.
 */
export function evaluateGrantFit(ngo: NGOProfile, grant: GrantOpportunity): {
  total_score: number;
  breakdown: ScoreBreakdown;
  issues: string[];
} {
  const thematic = calculateThematicScore(ngo.themes, grant.themes);
  const geographic = calculateGeographicScore(ngo.country, ngo.operating_regions, grant.eligible_regions);
  const eligResult = calculateEligibilityScore(ngo, grant);
  const fundResult = calculateFundingScore(ngo, grant);
  const beneficiary = calculateBeneficiaryScore(ngo.beneficiaries, grant.beneficiaries);

  const breakdown: ScoreBreakdown = {
    thematic,
    geographic,
    eligibility: eligResult.score,
    funding_size: fundResult.score,
    beneficiary,
  };

  // Weighted formula: Thematic 30%, Geographic 25%, Eligibility 20%, Funding 15%, Beneficiary 10%
  let total_score = Math.round(
    thematic * 0.30 +
    geographic * 0.25 +
    eligResult.score * 0.20 +
    fundResult.score * 0.15 +
    beneficiary * 0.10
  );

  // Geographic blocker override: If geographic fit is strictly 0, cap overall score at 25
  if (geographic === 0) {
    total_score = Math.min(25, total_score);
    eligResult.issues.unshift(`Ineligible Geography: Organization country (${ngo.country}) is outside eligible regions.`);
  }

  const issues = [...eligResult.issues, ...fundResult.issues];

  return {
    total_score: Math.max(0, Math.min(100, total_score)),
    breakdown,
    issues,
  };
}
