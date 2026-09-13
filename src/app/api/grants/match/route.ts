import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GrantOpportunity, MatchEvaluation, NGOProfile } from "@/types";
import { explainGrantMatch } from "@/lib/matching/explainer";
import { evaluateGrantFit } from "@/lib/matching/scoring-engine";
import { runLiveDiscoveryPipeline } from "@/lib/search/discovery-pipeline";
import { llmService } from "@/lib/llm/provider";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawNgo = body.ngo as NGOProfile;

    if (!rawNgo || !rawNgo.name || !rawNgo.country) {
      return NextResponse.json({ error: "Valid NGO profile with name and country is required." }, { status: 400 });
    }

    const triggerDiscovery = body.triggerDiscovery !== false;

    // 1. Persist NGO record in database
    let ngoRecord = rawNgo.id ? await prisma.nGO.findUnique({ where: { id: rawNgo.id } }) : null;

    if (!ngoRecord) {
      ngoRecord = await prisma.nGO.create({
        data: {
          name: rawNgo.name,
          website: rawNgo.website || null,
          description: rawNgo.description || "Civil society organization",
          country: rawNgo.country,
          operating_regions: JSON.stringify(rawNgo.operating_regions || [rawNgo.country]),
          themes: JSON.stringify(rawNgo.themes || []),
          beneficiaries: JSON.stringify(rawNgo.beneficiaries || []),
          annual_budget: rawNgo.annual_budget || null,
          requested_funding_min: rawNgo.requested_funding_min || null,
          requested_funding_max: rawNgo.requested_funding_max || null,
          years_operating: rawNgo.years_operating || 1,
          registration_status: rawNgo.registration_status || "Registered Non-Profit",
        },
      });
    }

    const ngoProfile: NGOProfile = {
      id: ngoRecord.id,
      name: ngoRecord.name,
      website: ngoRecord.website || undefined,
      description: ngoRecord.description,
      country: ngoRecord.country,
      operating_regions: JSON.parse(ngoRecord.operating_regions),
      themes: JSON.parse(ngoRecord.themes),
      beneficiaries: JSON.parse(ngoRecord.beneficiaries),
      annual_budget: ngoRecord.annual_budget,
      requested_funding_min: ngoRecord.requested_funding_min,
      requested_funding_max: ngoRecord.requested_funding_max,
      years_operating: ngoRecord.years_operating,
      registration_status: ngoRecord.registration_status,
      created_at: ngoRecord.created_at,
    };

    // 2. Fetch all existing active grants from internal DB
    let dbGrants = await prisma.grant.findMany({
      where: { status: { not: "expired" } },
    });

    const parseDbGrant = (g: (typeof dbGrants)[0]): GrantOpportunity => ({
      id: g.id,
      title: g.title,
      funder: g.funder,
      url: g.url,
      description: g.description,
      funding_min: g.funding_min,
      funding_max: g.funding_max,
      currency: g.currency,
      deadline: g.deadline,
      eligible_regions: JSON.parse(g.eligible_regions),
      eligible_org_types: JSON.parse(g.eligible_org_types),
      themes: JSON.parse(g.themes),
      beneficiaries: JSON.parse(g.beneficiaries),
      requirements: JSON.parse(g.requirements),
      operating_history_required: g.operating_history_required,
      source_domain: g.source_domain,
      status: g.status as any,
      discovered_at: g.discovered_at,
      last_checked_at: g.last_checked_at,
    });

    let grantOpportunities: GrantOpportunity[] = dbGrants.map(parseDbGrant);

    // 3. Evaluate initial match scores
    const preMatches = grantOpportunities.map((grant) => ({
      grant,
      fit: evaluateGrantFit(ngoProfile, grant),
    }));

    const strongMatchesCount = preMatches.filter((m) => m.fit.total_score >= 50).length;
    let discoveryResult = null;

    // 4. If fewer than 10 strong matches exist and discovery is enabled, trigger live discovery
    if (strongMatchesCount < 10 && triggerDiscovery) {
      discoveryResult = await runLiveDiscoveryPipeline(ngoProfile, ngoRecord.id);

      // Re-fetch all active grants from DB including newly inserted
      dbGrants = await prisma.grant.findMany({
        where: { status: { not: "expired" } },
      });
      grantOpportunities = dbGrants.map(parseDbGrant);
    }

    // 5. Score and generate explanations for candidate grants
    // Pre-filter to top candidates to optimize LLM call throughput
    const candidateRankings = grantOpportunities.map((grant) => ({
      grant,
      fit: evaluateGrantFit(ngoProfile, grant),
    }));

    // Sort candidate rankings by score descending
    candidateRankings.sort((a, b) => b.fit.total_score - a.fit.total_score);

    // Limit comprehensive AI explanation generation to top 25 matches
    const topCandidates = candidateRankings.slice(0, 25);

    const matches: MatchEvaluation[] = await Promise.all(
      topCandidates.map(async ({ grant }) => {
        const evaluation = await explainGrantMatch(ngoProfile, grant);

        // Upsert into GrantMatch table
        try {
          await prisma.grantMatch.upsert({
            where: {
              ngo_id_grant_id: {
                ngo_id: ngoRecord.id,
                grant_id: grant.id!,
              },
            },
            update: {
              total_score: evaluation.total_score,
              theme_score: evaluation.breakdown.thematic,
              geography_score: evaluation.breakdown.geographic,
              eligibility_score: evaluation.breakdown.eligibility,
              funding_score: evaluation.breakdown.funding_size,
              beneficiary_score: evaluation.breakdown.beneficiary,
              explanation: evaluation.explanation,
              risks: JSON.stringify(evaluation.risks),
              recommendation: evaluation.recommendation,
            },
            create: {
              ngo_id: ngoRecord.id,
              grant_id: grant.id!,
              total_score: evaluation.total_score,
              theme_score: evaluation.breakdown.thematic,
              geography_score: evaluation.breakdown.geographic,
              eligibility_score: evaluation.breakdown.eligibility,
              funding_score: evaluation.breakdown.funding_size,
              beneficiary_score: evaluation.breakdown.beneficiary,
              explanation: evaluation.explanation,
              risks: JSON.stringify(evaluation.risks),
              recommendation: evaluation.recommendation,
            },
          });
        } catch (err) {
          console.warn("Could not save match record to DB:", err);
        }

        return evaluation;
      })
    );

    // Sort final matches descending
    matches.sort((a, b) => b.total_score - a.total_score);

    return NextResponse.json({
      success: true,
      ngo: ngoProfile,
      matches,
      totalGrantsEvaluated: grantOpportunities.length,
      discoveryResult,
      isDemoMode: llmService.isDemoMode(),
      llmProvider: llmService.getProviderDisplayName(),
    });
  } catch (err: unknown) {
    console.error("Match processing error:", err);
    const message = err instanceof Error ? err.message : "Internal error processing grant matches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
