"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Building,
} from "lucide-react";
import { NGOProfile, RegistrationStatus } from "@/types";

const DEMO_PROFILES: Record<string, NGOProfile> = {
  education_kenya: {
    name: "Elimu Bora Girls Initiative",
    website: "https://elimubora-example.org",
    description: "Grassroots non-profit providing STEM education, secondary school scholarships, and mentorship for adolescent girls in rural Kenya.",
    country: "Kenya",
    operating_regions: ["Kenya", "East Africa"],
    themes: ["Education", "Girls' Education", "Gender Equality", "Technology for Impact"],
    beneficiaries: ["Women and Girls", "Youth and Adolescents", "Rural Communities"],
    annual_budget: 120000,
    requested_funding_min: 30000,
    requested_funding_max: 100000,
    years_operating: 3,
    registration_status: "Registered Non-Profit",
  },
  climate_peru: {
    name: "Amazonia Viva Agroforestry Coalition",
    website: "https://amazoniaviva-example.org",
    description: "Indigenous-led organization implementing community agroforestry, biodiversity monitoring, and sustainable coffee value chains in the Peruvian Amazon.",
    country: "Peru",
    operating_regions: ["Peru", "Latin America"],
    themes: ["Climate & Environment", "Agriculture & Food Security", "Community Resilience"],
    beneficiaries: ["Indigenous Peoples", "Smallholder Farmers", "Rural Communities"],
    annual_budget: 200000,
    requested_funding_min: 50000,
    requested_funding_max: 150000,
    years_operating: 4,
    registration_status: "Community-Based Organization (CBO)",
  },
  health_nigeria: {
    name: "Lafia Maternal Health Alliance",
    website: "https://lafiamaternal-example.org",
    description: "Delivering mobile prenatal clinics, clean delivery kits, and frontline community health worker training across Northern Nigeria.",
    country: "Nigeria",
    operating_regions: ["Nigeria", "West Africa"],
    themes: ["Healthcare", "Gender Equality", "Poverty Alleviation"],
    beneficiaries: ["Women and Girls", "Children and Infants", "Rural Communities"],
    annual_budget: 180000,
    requested_funding_min: 40000,
    requested_funding_max: 120000,
    years_operating: 2,
    registration_status: "Registered Non-Profit",
  },
};

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"website" | "manual">("website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form Profile State
  const [profile, setProfile] = useState<NGOProfile>({
    name: "",
    website: "",
    description: "",
    country: "Kenya",
    operating_regions: ["Kenya"],
    themes: ["Education", "Gender Equality"],
    beneficiaries: ["Women and Girls", "Youth"],
    annual_budget: 100000,
    requested_funding_min: 25000,
    requested_funding_max: 75000,
    years_operating: 3,
    registration_status: "Registered Non-Profit",
  });

  // String helpers for multi-value inputs
  const [themesInput, setThemesInput] = useState("Education, Gender Equality");
  const [regionsInput, setRegionsInput] = useState("Kenya, East Africa");
  const [beneficiariesInput, setBeneficiariesInput] = useState("Women and Girls, Youth");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check demo param
  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      loadDemoProfile("education_kenya");
    }
  }, [searchParams]);

  const loadDemoProfile = (key: string) => {
    const demo = DEMO_PROFILES[key];
    if (demo) {
      setProfile(demo);
      setWebsiteUrl(demo.website || "");
      setThemesInput(demo.themes.join(", "));
      setRegionsInput(demo.operating_regions.join(", "));
      setBeneficiariesInput(demo.beneficiaries.join(", "));
      setActiveTab("manual");
      setError(null);
    }
  };

  const handleCrawlWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) {
      setError("Please provide a valid website URL.");
      return;
    }

    setError(null);
    setIsCrawling(true);
    setCrawlMessage("Connecting securely & crawling pages (homepage, about, mission)...");

    try {
      const res = await fetch("/api/ngo/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to extract profile from website.");
      }

      if (data.profile) {
        setProfile(data.profile);
        setThemesInput((data.profile.themes || []).join(", "));
        setRegionsInput((data.profile.operating_regions || []).join(", "));
        setBeneficiariesInput((data.profile.beneficiaries || []).join(", "));
        setActiveTab("manual"); // Switch to manual review
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error analyzing website.");
    } finally {
      setIsCrawling(false);
      setCrawlMessage("");
    }
  };

  const handleFindFunding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.name.trim() || !profile.country.trim()) {
      setError("Please fill out the organization name and country.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const compiledProfile: NGOProfile = {
      ...profile,
      themes: themesInput.split(",").map((t) => t.trim()).filter(Boolean),
      operating_regions: regionsInput.split(",").map((r) => r.trim()).filter(Boolean),
      beneficiaries: beneficiariesInput.split(",").map((b) => b.trim()).filter(Boolean),
      annual_budget: profile.annual_budget ? Number(profile.annual_budget) : null,
      requested_funding_min: profile.requested_funding_min ? Number(profile.requested_funding_min) : null,
      requested_funding_max: profile.requested_funding_max ? Number(profile.requested_funding_max) : null,
      years_operating: profile.years_operating ? Number(profile.years_operating) : 1,
    };

    try {
      // Store in sessionStorage so results page can immediately read it
      sessionStorage.setItem("grantmatch_ngo_profile", JSON.stringify(compiledProfile));

      // Execute match request
      const res = await fetch("/api/grants/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngo: compiledProfile,
          triggerDiscovery: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Matching calculation failed.");
      }

      sessionStorage.setItem("grantmatch_match_results", JSON.stringify(data));
      router.push("/results");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to find funding.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Tell Us About Your NGO
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Our engine uses these attributes to calculate transparent thematic, geographic, eligibility, and budget fit.
        </p>
      </div>

      {/* Demo shortcuts */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Quick Demo Presets:</span>
        <button
          type="button"
          onClick={() => loadDemoProfile("education_kenya")}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          🇰🇪 Kenya Education NGO
        </button>
        <button
          type="button"
          onClick={() => loadDemoProfile("climate_peru")}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          🇵🇪 Peru Climate & Agroforestry
        </button>
        <button
          type="button"
          onClick={() => loadDemoProfile("health_nigeria")}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          🇳🇬 Nigeria Maternal Health
        </button>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveTab("website")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold border-b-2 transition ${
              activeTab === "website"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Option A: Paste Website URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold border-b-2 transition ${
              activeTab === "manual"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Option B: Review & Enter Manually</span>
          </button>
        </div>

        {error && (
          <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Tab A: Website Crawl */}
        {activeTab === "website" && (
          <div className="p-6 sm:p-10">
            <div className="max-w-xl mx-auto text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mx-auto">
                <Globe className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Automatic Website Extraction</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Enter your NGO's website. We safely crawl your public homepage and programs pages to infer your sector,
                geography, target beneficiaries, and mission statement.
              </p>

              <form onSubmit={handleCrawlWebsite} className="mt-8 space-y-4">
                <div>
                  <input
                    type="url"
                    placeholder="https://example-ngo.org"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCrawling}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{crawlMessage || "Analyzing NGO..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Analyze NGO Website</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>SSRF-protected • Timeout guarded • No authentication needed</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab B: Manual Form / Review Profile */}
        {activeTab === "manual" && (
          <form onSubmit={handleFindFunding} className="p-6 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  NGO / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Kenya Rural Education Trust"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Website URL
                </label>
                <input
                  type="url"
                  value={profile.website || ""}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://example.org"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Headquarters / Base Country *
                </label>
                <input
                  type="text"
                  required
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="e.g. Kenya, Peru, India"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Operating Geographies */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Operating Regions / Countries (comma-separated)
                </label>
                <input
                  type="text"
                  value={regionsInput}
                  onChange={(e) => setRegionsInput(e.target.value)}
                  placeholder="Kenya, East Africa, Sub-Saharan Africa"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Thematic Focus */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Thematic Focus Areas (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={themesInput}
                  onChange={(e) => setThemesInput(e.target.value)}
                  placeholder="Education, Girls' Education, STEM"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Beneficiaries */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Beneficiaries (comma-separated)
                </label>
                <input
                  type="text"
                  value={beneficiariesInput}
                  onChange={(e) => setBeneficiariesInput(e.target.value)}
                  placeholder="Women and Girls, Youth, Rural Communities"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mission & Project Description
                </label>
                <textarea
                  rows={3}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Provide an overview of your organization's core mission, programs, and target impact..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Annual Budget */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Annual Budget (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.annual_budget ?? ""}
                  onChange={(e) => setProfile({ ...profile, annual_budget: e.target.value ? Number(e.target.value) : null })}
                  placeholder="150000"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Funding Amount Sought */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Funding Amount Sought (USD Max)
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.requested_funding_max ?? ""}
                  onChange={(e) => setProfile({ ...profile, requested_funding_max: e.target.value ? Number(e.target.value) : null })}
                  placeholder="75000"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Years Operating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Years Operating
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.years_operating ?? 1}
                  onChange={(e) => setProfile({ ...profile, years_operating: e.target.value ? Number(e.target.value) : 1 })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Registration Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Registration Status
                </label>
                <select
                  value={profile.registration_status}
                  onChange={(e) => setProfile({ ...profile, registration_status: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Registered Non-Profit">Registered Non-Profit</option>
                  <option value="Community-Based Organization (CBO)">Community-Based Organization (CBO)</option>
                  <option value="Non-Governmental Organization (NGO)">Non-Governmental Organization (NGO)</option>
                  <option value="Charitable Trust / Foundation">Charitable Trust / Foundation</option>
                  <option value="Social Enterprise">Social Enterprise</option>
                  <option value="Pending Registration">Pending Registration</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Submission CTA */}
            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>Deterministic matching checks database first, triggering live web discovery if needed.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Evaluating Grants & Searching Web...</span>
                  </>
                ) : (
                  <>
                    <span>Find Funding</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading profile editor...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
