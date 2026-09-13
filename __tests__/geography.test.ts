import { calculateGeographicScore, evaluateGrantFit } from "../src/lib/matching/scoring-engine";
import { GrantOpportunity, NGOProfile } from "../src/types";

describe("Scoring Engine - Geographic Matching & Blocker Rules", () => {
  it("awards 100% for exact country match", () => {
    const score = calculateGeographicScore("Kenya", ["Kenya", "East Africa"], ["Kenya", "Uganda"]);
    expect(score).toBe(100);
  });

  it("awards 85% for regional hierarchy match", () => {
    // Kenya falls into East Africa and Sub-Saharan Africa
    const score = calculateGeographicScore("Kenya", ["Kenya"], ["Sub-Saharan Africa"]);
    expect(score).toBe(85);
  });

  it("awards 80% for Global eligibility", () => {
    const score = calculateGeographicScore("Peru", ["Peru"], ["Global"]);
    expect(score).toBe(80);
  });

  it("awards 0% when NGO country is not in eligible geography", () => {
    const score = calculateGeographicScore("Kenya", ["Kenya"], ["Latin America", "Brazil", "Colombia"]);
    expect(score).toBe(0);
  });

  it("caps overall match score at 25% if geographic fit is 0 (disqualification rule)", () => {
    const mockNgo: NGOProfile = {
      name: "Kenyan NGO",
      country: "Kenya",
      operating_regions: ["Kenya"],
      themes: ["Education"],
      beneficiaries: ["Children"],
      years_operating: 5,
      registration_status: "Registered Non-Profit",
      description: "Education work in Kenya",
    };

    const ineligibleGrant: GrantOpportunity = {
      title: "Brazil Rainforest Grant",
      funder: "Amazon Fund",
      url: "https://example.org/brazil",
      description: "Only for Brazil.",
      funding_min: 10000,
      funding_max: 50000,
      currency: "USD",
      deadline: null,
      eligible_regions: ["Brazil", "Latin America"],
      eligible_org_types: ["Non-Profit"],
      themes: ["Education"],
      beneficiaries: ["Children"],
      requirements: [],
      source_domain: "example.org",
      status: "verified",
    };

    const fit = evaluateGrantFit(mockNgo, ineligibleGrant);
    expect(fit.breakdown.geographic).toBe(0);
    expect(fit.total_score).toBeLessThanOrEqual(25);
    expect(fit.issues.some((i) => i.includes("Ineligible Geography"))).toBe(true);
  });
});
