"use client";

import React from "react";
import { MatchEvaluation } from "@/types";
import { ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getCanonicalFunderName } from "@/lib/utils/funder-canonical";
import { getGrantStatusInfo, formatDeadlineDisplay, formatVerifiedDate, formatFundingRange } from "@/lib/utils/grant-status";

interface MatchExplanationBlockProps {
  match: MatchEvaluation;
  compact?: boolean;
}

export function scoreTo5(score: number): number {
  if (score >= 88) return 5;
  if (score >= 68) return 4;
  if (score >= 48) return 3;
  if (score >= 25) return 2;
  return 1;
}

export default function MatchExplanationBlock({ match, compact = false }: MatchExplanationBlockProps) {
  const grant = match.grant;
  if (!grant) return null;

  const funderName = getCanonicalFunderName(grant.funder, grant.source_domain);
  const statusInfo = getGrantStatusInfo(grant);

  const criteria = [
    { label: "Mission alignment", val: scoreTo5(match.breakdown.thematic) },
    { label: "Geography", val: scoreTo5(match.breakdown.geographic) },
    { label: "Organisation type", val: scoreTo5(match.breakdown.eligibility) },
    { label: "Funding fit", val: scoreTo5(match.breakdown.funding_size) },
    { label: "Programme alignment", val: scoreTo5(match.breakdown.beneficiary) },
  ];

  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${compact ? "p-5" : "p-6"} space-y-5`}>
      {/* Header: Score & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-lg sm:text-xl font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            {match.total_score}% MATCH
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 block">{funderName}</span>
            <span className="text-[11px] text-slate-500">{grant.source_domain}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
            {statusInfo.label}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {formatVerifiedDate(grant.last_checked_at || grant.discovered_at)}
          </span>
        </div>
      </div>

      {/* 5-Factor Alignment Scale */}
      <div className="space-y-2 bg-slate-50/80 rounded-lg p-3.5 border border-slate-100 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Criteria Alignment Breakdown (5-Point Scale)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {criteria.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 w-3 rounded-xs ${
                        idx <= item.val ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-slate-900 w-6 text-right">{item.val}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY THIS MATCHES */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Why this matches</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/40 border border-emerald-100 rounded-lg p-3">
          {match.explanation}
        </p>
      </div>

      {/* WATCH OUT (Eligibility caveats / requirements) */}
      {match.risks && match.risks.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Watch out</span>
          </div>
          <div className="rounded-lg bg-amber-50/60 border border-amber-200/80 p-3 space-y-1">
            <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside leading-relaxed">
              {match.risks.map((risk, idx) => (
                <li key={idx} className="text-amber-800 font-medium">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metadata & Direct Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>Deadline: <strong className="text-slate-700">{formatDeadlineDisplay(grant.deadline)}</strong></span>
          <span>Funding: <strong className="text-slate-700">{formatFundingRange(grant.funding_min, grant.funding_max, grant.currency)}</strong></span>
        </div>

        <a
          href={grant.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-2xs"
        >
          <span>Official Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
