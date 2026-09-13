import { calculateFundingScore } from "../src/lib/matching/scoring-engine";
import { GrantOpportunity, NGOProfile } from "../src/types";

describe("Scoring Engine - Funding Bracket & Absorptive Capacity", () => {
  const baseNgo: NGOProfile = {
    name: "Sample NGO",
    country: "Ghana",
    operating_regions: ["Ghana"],
    themes: ["Healthcare"],
    beneficiaries: ["Rural Communities"],
    annual_budget: 100000,
    requested_funding_min: 20000,
    requested_funding_max: 60000,
    years_operating: 3,
    registration_status: "Registered Non-Profit",
    description: "Healthcare delivery",
  };

  const baseGrant: GrantOpportunity = {
    title: "Health Innovation Grant",
    funder: "Health Fund",
    url: "https://example.org/health",
    description: "Open health grant",
    funding_min: 25000,
    funding_max: 100000,
    currency: "USD",
    deadline: null,
    eligible_regions: ["Global"],
    eligible_org_types: ["Non-Profit"],
    themes: ["Healthcare"],
    beneficiaries: ["Rural Communities"],
    requirements: [],
    source_domain: "example.org",
    status: "verified",
  };

  it("gives high score when requested funding falls squarely in grant range", () => {
    const result = calculateFundingScore(baseNgo, baseGrant);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.issues.length).toBe(0);
  });

  it("deducts points and adds issue when requested funding exceeds grant cap", () => {
    const highRequestNgo: NGOProfile = {
      ...baseNgo,
      requested_funding_min: 150000,
      requested_funding_max: 200000,
    };

    const result = calculateFundingScore(highRequestNgo, baseGrant);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.issues.some((i) => i.includes("exceeds maximum grant cap"))).toBe(true);
  });

  it("flags absorptive capacity when grant max exceeds 2.5x annual budget", () => {
    const hugeGrant: GrantOpportunity = {
      ...baseGrant,
      funding_min: 100000,
      funding_max: 500000, // 5x NGO's $100k annual budget
    };

    const result = calculateFundingScore(baseNgo, hugeGrant);
    expect(result.issues.some((i) => i.includes("absorptive capacity"))).toBe(true);
  });
});
