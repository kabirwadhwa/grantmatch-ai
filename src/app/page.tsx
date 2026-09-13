import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, CheckCircle2, Award, Sparkles, Building2, Globe2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // ISR cache for 60s

export default async function HomePage() {
  let sampleGrants: any[] = [];
  try {
    const raw = await prisma.grant.findMany({
      take: 4,
      orderBy: { discovered_at: "desc" },
    });
    sampleGrants = raw.map((g) => ({
      ...g,
      eligible_regions: JSON.parse(g.eligible_regions),
      themes: JSON.parse(g.themes),
    }));
  } catch {
    sampleGrants = [];
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-900 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Open Intelligence for Civil Society</span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-700">Deterministic & Explainable</span>
          </div>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Find the grants your NGO is <span className="text-blue-600 underline decoration-blue-200 decoration-wavy">actually</span> eligible for.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-600 sm:text-xl leading-relaxed">
            GrantMatch AI searches live funding opportunities, checks eligibility, and ranks the grants that best match your mission.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/profile"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
            >
              <span>Find Funding</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/profile?demo=true"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
            >
              <span>View Demo</span>
            </Link>
          </div>

          {/* Institutional Trust Notice */}
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs sm:text-sm font-medium text-emerald-900">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-700" />
              <span>
                <strong>Free MVP.</strong> No grant listings are fabricated. Every opportunity links to its original source.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Methodology Section */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600">The Discovery Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How GrantMatch AI Works
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
              Deterministic eligibility matching paired with automated live public web discovery.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-lg">
                1
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Tell us about your NGO</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Paste your website URL for automatic extraction, or enter your sector focus, operating country, annual budget, and registration details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-lg">
                2
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">We search & evaluate</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Our pipeline searches verified funder domains and live open calls, filtering expired opportunities and extracting rigorous criteria.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-lg">
                3
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Ranked eligibility matches</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Receive ranked grants with a 5-point transparent score breakdown, specific eligibility warnings, and direct links to official applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Grants Preview */}
      {sampleGrants.length > 0 && (
        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Sample Open Opportunities
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Real public grant calls currently active and cataloged in our repository.
                </p>
              </div>
              <Link
                href="/directory"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>View all verified grants</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {sampleGrants.map((grant) => (
                <div
                  key={grant.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-6 transition hover:border-slate-300 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-800">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {grant.funder}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {grant.deadline
                          ? `Due ${new Date(grant.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                          : "Rolling deadline"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">
                      {grant.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {grant.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {grant.themes.slice(0, 3).map((theme: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs font-medium text-slate-600">
                    <div>
                      {grant.funding_min && grant.funding_max ? (
                        <span>
                          ${grant.funding_min.toLocaleString()} – ${grant.funding_max.toLocaleString()}
                        </span>
                      ) : grant.funding_max ? (
                        <span>Up to ${grant.funding_max.toLocaleString()}</span>
                      ) : (
                        <span>Flexible funding</span>
                      )}
                    </div>

                    <a
                      href={grant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Official Source →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
