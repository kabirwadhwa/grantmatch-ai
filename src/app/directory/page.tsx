import { prisma } from "@/lib/prisma";
import { Building2, Calendar, DollarSign, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getCanonicalFunderName } from "@/lib/utils/funder-canonical";
import { getGrantStatusInfo, formatDeadlineDisplay, formatFundingRange, formatVerifiedDate } from "@/lib/utils/grant-status";

export const dynamic = "force-dynamic";

function safeParse(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [val];
    }
  }
  return [];
}

export default async function DirectoryPage() {
  let grants: any[] = [];
  try {
    const raw = await prisma.grant.findMany({
      where: { status: { not: "expired" } },
      orderBy: { discovered_at: "desc" },
    });
    grants = raw.map((g) => ({
      ...g,
      eligible_regions: safeParse(g.eligible_regions),
      eligible_org_types: safeParse(g.eligible_org_types),
      themes: safeParse(g.themes),
      beneficiaries: safeParse(g.beneficiaries),
      requirements: safeParse(g.requirements),
    }));
  } catch (err) {
    grants = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Open Directory</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Public Grant Repository
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            All active grant opportunities currently indexed in GrantMatch AI. Every opportunity is backed by an official funder portal.
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Match With Your NGO →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {grants.map((grant) => {
          const funderName = getCanonicalFunderName(grant.funder, grant.source_domain, grant.url);
          const statusInfo = getGrantStatusInfo(grant);

          return (
            <div
              key={grant.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    {funderName}
                  </span>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h2 className="mt-3 text-base font-bold text-slate-900 line-clamp-2">
                  {grant.title}
                </h2>

                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {grant.description}
                </p>

                {/* Themes */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {grant.themes.slice(0, 3).map((theme: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500">
                    <DollarSign className="h-3 w-3" />
                    Amount
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatFundingRange(grant.funding_min, grant.funding_max, grant.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Deadline
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDeadlineDisplay(grant.deadline)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 text-right">
                  {formatVerifiedDate(grant.last_checked_at || grant.discovered_at)}
                </div>

                <div className="pt-2">
                  <a
                    href={grant.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span>Open Official Grant Page</span>
                    <ExternalLink className="h-3 w-3 text-slate-500" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
