import { ShieldCheck, Scale, Cpu, Search, CheckCircle, AlertTriangle } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Platform Transparency</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Scoring Methodology & Architecture
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          GrantMatch AI is designed around a core civic principle: <strong>transparent, explainable matching</strong>.
          We do not use an opaque LLM prompt to arbitrarily pick grants. Instead, we compute deterministic multi-dimensional
          scores and use language models strictly for text extraction, nuanced eligibility verification, and actionable synthesis.
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {/* Weighted Scoring Model */}
        <section>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">1. Transparent 5-Factor Weighted Scoring Model</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Every grant is evaluated across five distinct dimensions, scaled from 0 to 100, and weighted into a composite compatibility score:
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Dimension</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3">Evaluation Method</th>
                  <th className="px-4 py-3">Key Rules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">Thematic Fit</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">30%</td>
                  <td className="px-4 py-3">Jaccard token similarity & cross-taxonomy mapping</td>
                  <td className="px-4 py-3">Maps synonyms (e.g. STEM → Education, Renewable → Climate).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">Geographic Fit</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">25%</td>
                  <td className="px-4 py-3">Country & regional hierarchy traversal</td>
                  <td className="px-4 py-3">Exact country = 100%, Regional = 85%, Global = 80%. If country is excluded, score is 0% (caps total score).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">Organization Eligibility</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">20%</td>
                  <td className="px-4 py-3">Legal status & minimum operating history</td>
                  <td className="px-4 py-3">Validates NGO registration status against funder requirements (deducts 35pts if operating history is insufficient).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">Funding-Size Fit</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">15%</td>
                  <td className="px-4 py-3">Range overlap & absorptive capacity sanity checks</td>
                  <td className="px-4 py-3">Checks if requested amount falls within grant min/max. Flags grants exceeding 2.5x annual budget.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">Beneficiary Fit</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">10%</td>
                  <td className="px-4 py-3">Target population overlap analysis</td>
                  <td className="px-4 py-3">Evaluates alignment on priority vulnerable groups (e.g. Women & Girls, Smallholder Farmers, Youth).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Discovery Pipeline */}
        <section>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">2. Modular Live Discovery Layer</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Unlike static directories that go stale within months, GrantMatch AI operates an active discovery pipeline:
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Self-Improving Database</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Matches are first checked against the internal curated repository. If fewer than 10 strong matches exist, the system triggers live targeted search queries.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Targeted Query Generation</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Generates 4-6 specific search strings combining current year, priority theme, target country, and funder keywords to isolate original calls for proposals.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Pluggable Search Providers</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Supports Tavily, Google Serper, and Brave Search via a clean interface adapter, with a zero-cost offline mock provider for out-of-the-box local testing.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm">Canonical Deduplication</h3>
              <p className="mt-1.5 text-slate-600 leading-relaxed">
                Normalizes URLs by stripping tracking parameters and trailing slashes, rejecting duplicate submissions and known scraper aggregators.
              </p>
            </div>
          </div>
        </section>

        {/* Security & SSRF */}
        <section>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">3. Source Verification & SSRF Defense</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            GrantMatch AI implements enterprise-grade Server-Side Request Forgery (SSRF) defenses:
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 list-disc list-inside">
            <li>DNS pre-resolution to block loopback (<code>127.0.0.1</code>), RFC1918 private subnets, and cloud metadata (<code>169.254.169.254</code>).</li>
            <li>Enforced HTTP timeouts (max 6-7 seconds) and 1.5 MB download size limits to prevent Denial of Service.</li>
            <li>Hop-by-hop redirect inspection ensuring redirection targets are re-validated before connection.</li>
            <li><strong>Zero Hallucination Policy:</strong> Every opportunity shown requires a reachable, valid external source URL.</li>
          </ul>
        </section>

        {/* Limitations & Legal Disclaimer */}
        <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                Limitations & Operational Disclaimer
              </h3>
              <div className="mt-2 text-xs text-amber-800 space-y-2 leading-relaxed">
                <p>
                  GrantMatch AI is an advisory matching tool designed to assist civil society organizations in finding potential funding opportunities.
                </p>
                <p>
                  <strong>No Guarantee of Funding:</strong> A high match score (e.g. 90%+) indicates strong alignment with published criteria,
                  but does not constitute a guarantee of grant eligibility, award, or consideration by the funding institution.
                </p>
                <p>
                  Funders frequently update their application guidelines, internal priorities, and deadlines without notice.
                  Users must always verify complete requirements, guidelines, and submission procedures directly on the official funder website.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
