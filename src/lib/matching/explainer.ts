import { GrantOpportunity, MatchEvaluation, NGOProfile, ScoreBreakdown } from "../../types";
import { llmService } from "../llm/provider";
import { evaluateGrantFit } from "./scoring-engine";

/**
 * Deterministic generation of strong fit reasons, explanations, and next steps
 * when LLM is in demo/fallback mode.
 */
export function generateDeterministicExplanation(
  ngo: NGOProfile,
  grant: GrantOpportunity,
  breakdown: ScoreBreakdown,
  totalScore: number,
  issues: string[]
): { explanation: string; recommendation: string; risks: string[] } {
  // Synthesize fit reasons
  const fitPoints: string[] = [];

  if (breakdown.thematic >= 70) {
    fitPoints.push(`Strong thematic alignment across ${ngo.themes.slice(0, 3).join(", ")}.`);
  }
  if (breakdown.geographic >= 80) {
    fitPoints.push(`Target region matches grant operational scope (${grant.eligible_regions.slice(0, 2).join(", ")}).`);
  }
  if (breakdown.funding_size >= 80) {
    fitPoints.push(`Funding request aligns with grant bracket ($${grant.funding_min?.toLocaleString() ?? 0} - $${grant.funding_max?.toLocaleString() ?? "Open"}).`);
  }
  if (breakdown.beneficiary >= 70) {
    fitPoints.push(`Shared focus on priority beneficiary groups (${ngo.beneficiaries.slice(0, 2).join(", ")}).`);
  }

  const fitSummary = fitPoints.length > 0
    ? fitPoints.join(" ")
    : "Moderate overlap with grant priority themes and eligibility requirements.";

  let explanation = `${grant.funder}'s "${grant.title}" is a ${totalScore}% match. ${fitSummary}`;

  if (llmService.isDemoMode()) {
    explanation += " (AI analysis is running in deterministic demo mode).";
  }

  // Next steps recommendations based on deadline and criteria
  let recommendation = `Review the official grant guidelines at ${grant.source_domain}.`;
  if (grant.deadline) {
    const deadlineDate = new Date(grant.deadline);
    const daysUntil = Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil <= 30) {
      recommendation = `Deadline is in ${daysUntil} days: Download concept note guidelines immediately and initiate draft budget.`;
    } else if (daysUntil > 30) {
      recommendation = `Application window open (${daysUntil} days remaining): Formulate partnership strategy and align project outcomes with funder priorities.`;
    }
  } else {
    recommendation = "Rolling window: Prepare a 2-page concept note highlighting evidence of impact and submit via funder portal.";
  }

  return {
    explanation,
    recommendation,
    risks: issues.length > 0 ? issues : ["Ensure compliance with standard non-profit governance documentation."],
  };
}

/**
 * Generates match evaluation combining deterministic scores with LLM-enhanced
 * nuanced explanations and risk identification.
 */
export async function explainGrantMatch(
  ngo: NGOProfile,
  grant: GrantOpportunity
): Promise<MatchEvaluation> {
  const { total_score, breakdown, issues } = evaluateGrantFit(ngo, grant);

  if (llmService.isDemoMode()) {
    const { explanation, recommendation, risks } = generateDeterministicExplanation(
      ngo,
      grant,
      breakdown,
      total_score,
      issues
    );

    return {
      total_score,
      breakdown,
      explanation,
      risks,
      recommendation,
      grant,
    };
  }

  // LLM-powered explanation
  const prompt = `You are an expert grant advisor. Analyze this deterministic match calculation and provide a crisp, professional evaluation.

NGO:
- Name: ${ngo.name}
- Country: ${ngo.country} (Regions: ${ngo.operating_regions.join(", ")})
- Themes: ${ngo.themes.join(", ")}
- Beneficiaries: ${ngo.beneficiaries.join(", ")}
- Annual Budget: $${ngo.annual_budget ?? "Unknown"}
- Funding Sought: $${ngo.requested_funding_min ?? 0} - $${ngo.requested_funding_max ?? 0}
- Years Operating: ${ngo.years_operating ?? 1}
- Registration: ${ngo.registration_status}

Grant:
- Title: ${grant.title}
- Funder: ${grant.funder}
- Eligible Regions: ${grant.eligible_regions.join(", ")}
- Eligible Org Types: ${grant.eligible_org_types.join(", ")}
- Themes: ${grant.themes.join(", ")}
- Beneficiaries: ${grant.beneficiaries.join(", ")}
- Requirements: ${grant.requirements.join("; ")}
- Funding Range: $${grant.funding_min ?? 0} - $${grant.funding_max ?? 0}
- Deadline: ${grant.deadline ? new Date(grant.deadline).toISOString().split("T")[0] : "Rolling"}

Calculated Deterministic Match Score: ${total_score}%
Breakdown: Thematic: ${breakdown.thematic}, Geography: ${breakdown.geographic}, Eligibility: ${breakdown.eligibility}, Funding: ${breakdown.funding_size}, Beneficiaries: ${breakdown.beneficiary}
Pre-identified Caveats: ${issues.join("; ") || "None"}

Return ONLY a JSON object:
{
  "explanation": "2-3 sentences explaining exactly why this grant matches this NGO, referencing specific mission synergy.",
  "risks": ["1-3 specific potential eligibility issues, compliance blockers, or rigorous requirements"],
  "recommendation": "One specific, actionable next step for the NGO team"
}`;

  try {
    const rawResponse = await llmService.complete(prompt, {
      system: "You are an institutional grant advisor providing concise, realistic funding intelligence. Respond with valid JSON.",
      json: true,
      temperature: 0.1,
    });

    if (!rawResponse) {
      const fallback = generateDeterministicExplanation(ngo, grant, breakdown, total_score, issues);
      return {
        total_score,
        breakdown,
        explanation: fallback.explanation,
        risks: fallback.risks,
        recommendation: fallback.recommendation,
        grant,
      };
    }

    const clean = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      total_score,
      breakdown,
      explanation: parsed.explanation || `Match score of ${total_score}%.`,
      risks: Array.isArray(parsed.risks) && parsed.risks.length > 0 ? parsed.risks : issues,
      recommendation: parsed.recommendation || "Review funder application portal.",
      grant,
    };
  } catch (err) {
    console.warn("LLM explanation error, using deterministic explanation:", err);
    const fallback = generateDeterministicExplanation(ngo, grant, breakdown, total_score, issues);
    return {
      total_score,
      breakdown,
      explanation: fallback.explanation,
      risks: fallback.risks,
      recommendation: fallback.recommendation,
      grant,
    };
  }
}
