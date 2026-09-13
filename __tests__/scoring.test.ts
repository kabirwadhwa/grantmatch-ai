import {
  calculateThematicScore,
  calculateEligibilityScore,
  calculateBeneficiaryScore,
  evaluateGrantFit,
} from "../src/lib/matching/scoring-engine";
import { GrantOpportunity, NGOProfile } from "../src/types";

describe("Scoring Engine - Thematic & Beneficiary Matching", () => {
  it("computes high thematic score for direct matches and synonyms", () => {
    const ngoThemes = ["Education", "Girls' Education", "STEM"];
    const grantThemes = ["Education", "Technology", "Training"];

    const score = calculateThematicScore(ngoThemes, grantThemes);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("handles unrelated themes with low baseline score", () => {
    const ngoThemes = ["Arts & Culture", "Theater"];
    const grantThemes = ["Biomedical Clinical Trials", "Infectious Disease"];

    const score = calculateThematicScore(ngoThemes, grantThemes);
    expect(score).toBeLessThanOrEqual(40);
  });

  it("computes high beneficiary score for overlapping target populations", () => {
    const ngoBen = ["Women and Girls", "Rural Communities"];
    const grantBen = ["Women and Girls", "Smallholder Farmers"];

    const score = calculateBeneficiaryScore(ngoBen, grantBen);
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("calculates overall multi-factor score correctly using 30-25-20-15-10 weights", () => {
    const mockNgo: NGOProfile = {
      name: "Test NGO",
      country: "Kenya",
      operating_regions: ["Kenya", "East Africa"],
      themes: ["Education", "Girls' Education"],
      beneficiaries: ["Women and Girls", "Youth"],
      annual_budget: 150000,
      requested_funding_min: 25000,
      requested_funding_max: 75000,
      years_operating: 3,
      registration_status: "Registered Non-Profit",
      description: "Dedicated to education.",
    };

    const mockGrant: GrantOpportunity = {
      title: "Girls Education Fund",
      funder: "Global Foundation",
      url: "https://example.org/grant",
      description: "Supporting girls schooling.",
      funding_min: 20000,
      funding_max: 100000,
      currency: "USD",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      eligible_regions: ["Kenya", "East Africa"],
      eligible_org_types: ["Non-Profit", "NGO"],
      themes: ["Education", "Gender Equality"],
      beneficiaries: ["Women and Girls", "Youth"],
      requirements: ["Audited accounts"],
      operating_history_required: 2,
      source_domain: "example.org",
      status: "verified",
    };

    const result = evaluateGrantFit(mockNgo, mockGrant);
    expect(result.total_score).toBeGreaterThanOrEqual(85);
    expect(result.breakdown.thematic).toBeGreaterThanOrEqual(80);
    expect(result.breakdown.geographic).toBe(100);
    expect(result.breakdown.eligibility).toBe(100);
  });
});
