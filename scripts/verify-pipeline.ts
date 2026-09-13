import { prisma } from "../src/lib/prisma";
import { evaluateGrantFit } from "../src/lib/matching/scoring-engine";
import { explainGrantMatch } from "../src/lib/matching/explainer";
import { generateDiscoveryQueries } from "../src/lib/search/query-generator";
import { getSearchProvider } from "../src/lib/search/providers/factory";
import { runLiveDiscoveryPipeline } from "../src/lib/search/discovery-pipeline";
import { NGOProfile, GrantOpportunity } from "../src/types";

async function verify() {
  console.log("=== GRANTMATCH AI SYSTEM VERIFICATION ===");

  // 1. Database check
  const grantCount = await prisma.grant.count();
  console.log(`✓ Database operational. Total verified grants in repository: ${grantCount}`);
  if (grantCount < 10) {
    throw new Error(`Expected at least 10 seeded grants, found ${grantCount}`);
  }

  // 2. NGO Profile Test
  const testNgo: NGOProfile = {
    name: "Elimu Bora Girls Initiative",
    country: "Kenya",
    operating_regions: ["Kenya", "East Africa"],
    themes: ["Education", "Girls' Education", "Gender Equality"],
    beneficiaries: ["Women and Girls", "Youth"],
    annual_budget: 120000,
    requested_funding_min: 25000,
    requested_funding_max: 75000,
    years_operating: 3,
    registration_status: "Registered Non-Profit",
    description: "Providing STEM education and scholarships for adolescent girls in rural Kenya.",
  };

  // 3. Search query generation test
  const queries = generateDiscoveryQueries(testNgo);
  console.log(`✓ Generated ${queries.length} targeted discovery queries:`);
  queries.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

  // 4. Discovery provider test
  const provider = getSearchProvider();
  console.log(`✓ Active search provider: ${provider.name}`);
  const searchResults = await provider.search(queries[0], { limit: 3 });
  console.log(`✓ Provider returned ${searchResults.length} candidate results:`);
  searchResults.forEach((r) => console.log(`   - [${r.sourceDomain}] ${r.title}`));

  // 5. Match engine test
  const sampleGrants = await prisma.grant.findMany({ take: 5 });
  console.log(`\n✓ Evaluating test NGO against repository grants:`);
  for (const raw of sampleGrants) {
    const grant: GrantOpportunity = {
      id: raw.id,
      title: raw.title,
      funder: raw.funder,
      url: raw.url,
      description: raw.description,
      funding_min: raw.funding_min,
      funding_max: raw.funding_max,
      currency: raw.currency,
      deadline: raw.deadline,
      eligible_regions: JSON.parse(raw.eligible_regions),
      eligible_org_types: JSON.parse(raw.eligible_org_types),
      themes: JSON.parse(raw.themes),
      beneficiaries: JSON.parse(raw.beneficiaries),
      requirements: JSON.parse(raw.requirements),
      operating_history_required: raw.operating_history_required,
      source_domain: raw.source_domain,
      status: raw.status as any,
    };

    const evaluation = await explainGrantMatch(testNgo, grant);
    console.log(`\n   • Grant: "${grant.title}" (${grant.funder})`);
    console.log(`     Total Match: ${evaluation.total_score}%`);
    console.log(`     Breakdown: Theme: ${evaluation.breakdown.thematic}% | Geo: ${evaluation.breakdown.geographic}% | Elig: ${evaluation.breakdown.eligibility}% | Fund: ${evaluation.breakdown.funding_size}% | Ben: ${evaluation.breakdown.beneficiary}%`);
    console.log(`     Explanation: ${evaluation.explanation}`);
    if (evaluation.risks.length > 0) {
      console.log(`     Risks/Blockers: ${evaluation.risks.join("; ")}`);
    }
    console.log(`     Next Action: ${evaluation.recommendation}`);
  }

  // 6. Live Discovery Pipeline Execution
  console.log(`\n✓ Executing end-to-end live discovery pipeline test...`);
  const discoveryResult = await runLiveDiscoveryPipeline(testNgo);
  console.log(`✓ Live discovery finished. Evaluated ${discoveryResult.urlsEvaluated} candidate URLs.`);

  console.log("\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

verify()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
