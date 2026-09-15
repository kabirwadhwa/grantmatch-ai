"use client";

import { MatchEvaluation } from "@/types";
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { getCanonicalFunderName } from "@/lib/utils/funder-canonical";
import { getGrantStatusInfo, formatDeadlineDisplay, formatVerifiedDate, formatFundingRange } from "@/lib/utils/grant-status";
import { scoreTo5 } from "./MatchExplanationBlock";

interface GrantDetailModalProps {
  match: MatchEvaluation | null;
  onClose: () => void;
}

export default function GrantDetailModal({ match, onClose }: GrantDetailModalProps) {
  if (!match || !match.grant) return null;

  const { grant, breakdown, total_score, explanation, risks, recommendation } = match;
  const funderName = getCanonicalFunderName(grant.funder, grant.source_domain);
  const statusInfo = getGrantStatusInfo(grant);

  const criteria = [
    { label: "Mission alignment", val: scoreTo5(breakdown.thematic) },
    { label: "Geography", val: scoreTo5(breakdown.geographic) },
    { label: "Organisation type", val: scoreTo5(breakdown.eligibility) },
    { label: "Funding fit", val: scoreTo5(breakdown.funding_size) },
    { label: "Programme alignment", val: scoreTo5(breakdown.beneficiary) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/80 p-6">
          <div className="pr-6 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
                {funderName}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">{grant.source_domain}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {grant.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Match Score & 5-factor scale */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transparent Match Fit
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Calculated against your mission, geographic scope, legal form, and requested budget.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 font-extrabold text-2xl text-emerald-800">
                <span>{total_score}%</span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Fit</span>
              </div>
            </div>

            {/* 5 criteria bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              {criteria.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`h-2 w-3.5 rounded-xs ${
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

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                Funding Range
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatFundingRange(grant.funding_min, grant.funding_max, grant.currency)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Deadline
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatDeadlineDisplay(grant.deadline)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Track Record
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {grant.operating_history_required ? `${grant.operating_history_required}+ Years Required` : "No Minimum"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                Trust Status
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatVerifiedDate(grant.last_checked_at || grant.discovered_at)}
              </p>
            </div>
          </div>

          {/* WHY THIS MATCHES */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Why this matches</span>
            </h3>
            <div className="rounded-lg bg-emerald-50/50 border border-emerald-200/80 p-4">
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {explanation}
              </p>
            </div>
          </div>

          {/* WATCH OUT */}
          {risks && risks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Watch out</span>
              </h3>
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside leading-relaxed">
                  {risks.map((risk, idx) => (
                    <li key={idx} className="font-medium">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommended Next Action */}
          {recommendation && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex items-start gap-2.5">
              <Lightbulb className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Recommended Immediate Next Action
                </h4>
                <p className="mt-1 text-xs text-blue-800 font-medium leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Grant Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Grant Summary</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {grant.description}
            </p>
          </div>

          {/* Eligible Regions & Themes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Eligible Geographies
              </span>
              <div className="flex flex-wrap gap-1">
                {grant.eligible_regions.map((reg, idx) => (
                  <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {reg}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Target Sectors / Themes
              </span>
              <div className="flex flex-wrap gap-1">
                {grant.themes.map((theme, idx) => (
                  <span key={idx} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Requirements list */}
          {grant.requirements && grant.requirements.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Stated Funder Criteria</h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {grant.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 p-6">
          <div className="text-xs text-slate-500">
            Source: <span className="font-semibold text-slate-700">{grant.source_domain}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>

            <a
              href={grant.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              <span>Official Source →</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
