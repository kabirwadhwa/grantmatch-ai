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
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface GrantDetailModalProps {
  match: MatchEvaluation | null;
  onClose: () => void;
}

export default function GrantDetailModal({ match, onClose }: GrantDetailModalProps) {
  if (!match || !match.grant) return null;

  const { grant, breakdown, total_score, explanation, risks, recommendation } = match;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-amber-700 bg-amber-50 border-amber-200";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-600";
    if (score >= 60) return "bg-blue-600";
    return "bg-amber-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/70 p-6">
          <div className="pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-800">
                <Building2 className="h-3 w-3 text-slate-600" />
                {grant.funder}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500">{grant.source_domain}</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {grant.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Match Score & 5-factor breakdown banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Match</span>
                <p className="text-sm text-slate-600 mt-0.5">Calculated using transparent 5-factor weighted formula</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-bold text-2xl ${getScoreColor(total_score)}`}>
                <span>{total_score}%</span>
                <span className="text-xs font-semibold uppercase tracking-wider">Fit</span>
              </div>
            </div>

            {/* Dimensional breakdown progress bars */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Theme (30%)</span>
                  <span>{breakdown.thematic}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getBarColor(breakdown.thematic)}`} style={{ width: `${breakdown.thematic}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Geo (25%)</span>
                  <span>{breakdown.geographic}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getBarColor(breakdown.geographic)}`} style={{ width: `${breakdown.geographic}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Eligibility (20%)</span>
                  <span>{breakdown.eligibility}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getBarColor(breakdown.eligibility)}`} style={{ width: `${breakdown.eligibility}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Funding (15%)</span>
                  <span>{breakdown.funding_size}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getBarColor(breakdown.funding_size)}`} style={{ width: `${breakdown.funding_size}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Beneficiary (10%)</span>
                  <span>{breakdown.beneficiary}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getBarColor(breakdown.beneficiary)}`} style={{ width: `${breakdown.beneficiary}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                Funding Bracket
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {grant.funding_min && grant.funding_max
                  ? `$${grant.funding_min.toLocaleString()} - $${grant.funding_max.toLocaleString()}`
                  : grant.funding_max
                  ? `Up to $${grant.funding_max.toLocaleString()}`
                  : "Not specified"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Deadline
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {grant.deadline
                  ? new Date(grant.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Rolling / Open"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                History Req.
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {grant.operating_history_required ? `${grant.operating_history_required}+ Years` : "None Stated"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                Verified Status
              </span>
              <p className="mt-1 text-sm font-bold capitalize text-emerald-700">
                {grant.status.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Why This NGO Matches</h3>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-lg p-3.5">
              {explanation}
            </p>
          </div>

          {/* Potential Blockers / Risks Alert */}
          {risks && risks.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Potential Eligibility Blockers & Requirements
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-amber-800">
                    {risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Next Action */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Recommended Immediate Next Action
                </h4>
                <p className="mt-1 text-xs text-emerald-800 font-medium">
                  {recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Grant Summary & Scope */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Grant Summary</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {grant.description}
            </p>
          </div>

          {/* Requirements & Criteria list */}
          {grant.requirements && grant.requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Stated Funder Criteria</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
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
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-6">
          <div className="text-xs text-slate-500">
            Source domain: <strong>{grant.source_domain}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>

            <a
              href={grant.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <span>Open Official Grant Page</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
