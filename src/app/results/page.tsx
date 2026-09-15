"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Info,
  ShieldCheck,
  Globe2,
  CheckCircle2,
} from "lucide-react";
import { MatchEvaluation, NGOProfile } from "@/types";
import GrantDetailModal from "@/components/GrantDetailModal";
import { getCanonicalFunderName } from "@/lib/utils/funder-canonical";
import { getGrantStatusInfo, formatDeadlineDisplay, formatFundingRange, formatVerifiedDate } from "@/lib/utils/grant-status";
import { scoreTo5 } from "@/components/MatchExplanationBlock";

export default function ResultsPage() {
  const [ngoProfile, setNgoProfile] = useState<NGOProfile | null>(null);
  const [matches, setMatches] = useState<MatchEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryLog, setDiscoveryLog] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchEvaluation | null>(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [sortBy, setSortBy] = useState<"match" | "deadline" | "funding" | "newest">("match");

  useEffect(() => {
    // Load stored results from sessionStorage or fetch default
    const storedNgo = sessionStorage.getItem("grantmatch_ngo_profile");
    const storedResults = sessionStorage.getItem("grantmatch_match_results");

    if (storedResults && storedNgo) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setMatches(parsedResults.matches || []);
        setNgoProfile(JSON.parse(storedNgo));
        setLoading(false);
        return;
      } catch {
        // Fallback to auto-matching demo
      }
    }

    // Default: initialize with demo profile
    const defaultNgo: NGOProfile = {
      name: "Elimu Bora Girls Initiative",
      country: "Kenya",
      operating_regions: ["Kenya", "East Africa"],
      themes: ["Education", "Girls' Education", "Gender Equality"],
      beneficiaries: ["Women and Girls", "Youth"],
      annual_budget: 120000,
      requested_funding_max: 100000,
      years_operating: 3,
      registration_status: "Registered Non-Profit",
      description: "Grassroots non-profit providing STEM education and scholarships for adolescent girls in rural Kenya.",
    };

    setNgoProfile(defaultNgo);

    fetch("/api/grants/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ngo: defaultNgo, triggerDiscovery: false }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading default matches:", err);
        setLoading(false);
      });
  }, []);

  const handleTriggerLiveDiscovery = async () => {
    if (!ngoProfile) return;
    setIsDiscovering(true);
    setDiscoveryLog("Searching public web funder pages & generating queries...");

    try {
      const res = await fetch("/api/grants/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngo: ngoProfile, triggerDiscovery: true }),
      });
      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
        sessionStorage.setItem("grantmatch_match_results", JSON.stringify(data));
        const count = data.discoveryResult?.newGrantsDiscovered || 0;
        setDiscoveryLog(`Discovery complete! Processed candidate funder URLs (${count} new opportunities added).`);
      }
    } catch (err) {
      setDiscoveryLog("Could not execute live search right now.");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Extract themes and regions present in current matches for filter dropdowns
  const availableThemes = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.grant?.themes.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [matches]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.grant?.eligible_regions.forEach((r) => set.add(r)));
    return Array.from(set);
  }, [matches]);

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    return matches
      .filter((m) => {
        if (!m.grant) return false;
        if (m.total_score < minScore) return false;

        if (selectedTheme !== "all" && !m.grant.themes.includes(selectedTheme)) {
          return false;
        }

        if (
          selectedRegion !== "all" &&
          !m.grant.eligible_regions.some((r) => r.toLowerCase().includes(selectedRegion.toLowerCase()))
        ) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText = `${m.grant.title} ${m.grant.funder} ${m.grant.description} ${m.explanation}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "match") return b.total_score - a.total_score;
        if (sortBy === "deadline") {
          const dA = a.grant?.deadline ? new Date(a.grant.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          const dB = b.grant?.deadline ? new Date(b.grant.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          return dA - dB;
        }
        if (sortBy === "funding") {
          const fA = a.grant?.funding_max || 0;
          const fB = b.grant?.funding_max || 0;
          return fB - fA;
        }
        if (sortBy === "newest") {
          const tA = a.grant?.discovered_at ? new Date(a.grant.discovered_at).getTime() : 0;
          const tB = b.grant?.discovered_at ? new Date(b.grant.discovered_at).getTime() : 0;
          return tB - tA;
        }
        return 0;
      });
  }, [matches, minScore, selectedTheme, selectedRegion, searchQuery, sortBy]);

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-600/20";
    if (score >= 60) return "bg-blue-50 text-blue-800 border-blue-300 ring-blue-600/20";
    return "bg-amber-50 text-amber-800 border-amber-300 ring-amber-600/20";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <span>Grant Discovery Dashboard</span>
            <span>•</span>
            <span>{matches.length} Opportunities Evaluated</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Ranked Grant Matches
          </h1>
          {ngoProfile && (
            <p className="mt-2 text-sm text-slate-600">
              Evaluated for: <strong className="text-slate-900">{ngoProfile.name}</strong> ({ngoProfile.country}) • Seeking{" "}
              {ngoProfile.requested_funding_max ? `up to $${ngoProfile.requested_funding_max.toLocaleString()}` : "funding"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/profile"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Edit NGO Profile
          </Link>

          <button
            onClick={handleTriggerLiveDiscovery}
            disabled={isDiscovering}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDiscovering ? "animate-spin" : ""}`} />
            <span>{isDiscovering ? "Searching Live Web..." : "Trigger Live Web Discovery"}</span>
          </button>
        </div>
      </div>

      {discoveryLog && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>{discoveryLog}</span>
          </div>
          <button onClick={() => setDiscoveryLog(null)} className="text-blue-500 hover:text-blue-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Keyword search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword, funder, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Theme Filter */}
          <div>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Sectors & Themes</option>
              {availableThemes.map((theme, idx) => (
                <option key={idx} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Geographies</option>
              {availableRegions.map((region, idx) => (
                <option key={idx} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="match">Sort: Best Fit Score</option>
              <option value="deadline">Sort: Soonest Deadline</option>
              <option value="funding">Sort: Funding Size (High-Low)</option>
              <option value="newest">Sort: Newly Discovered</option>
            </select>
          </div>
        </div>

        {/* Score Threshold Slider */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span>Minimum Match Score: <strong>{minScore}%</strong></span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="10"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-36 accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="mt-12 text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Evaluating grants against NGO profile...</p>
        </div>
      ) : filteredAndSortedMatches.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Info className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-900">No matching grants found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your score filter or trigger live web discovery to search public funder portals.
          </p>
          <button
            onClick={() => {
              setMinScore(0);
              setSelectedTheme("all");
              setSelectedRegion("all");
              setSearchQuery("");
            }}
            className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredAndSortedMatches.map((match) => {
            const grant = match.grant;
            if (!grant) return null;

            const funderName = getCanonicalFunderName(grant.funder, grant.source_domain, grant.url);
            const statusInfo = getGrantStatusInfo(grant);
            const criteria = [
              { label: "Mission alignment", val: scoreTo5(match.breakdown.thematic) },
              { label: "Geography", val: scoreTo5(match.breakdown.geographic) },
              { label: "Organisation type", val: scoreTo5(match.breakdown.eligibility) },
              { label: "Funding fit", val: scoreTo5(match.breakdown.funding_size) },
              { label: "Programme alignment", val: scoreTo5(match.breakdown.beneficiary) },
            ];

            return (
              <div
                key={grant.id || grant.url}
                onClick={() => setSelectedMatch(match)}
                className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        {funderName}
                      </span>

                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{grant.source_domain}</span>

                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {formatVerifiedDate(grant.last_checked_at || grant.discovered_at)}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {grant.title}
                    </h3>

                    {/* Themes & regions */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {grant.themes.slice(0, 3).map((theme, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          {theme}
                        </span>
                      ))}
                      {grant.eligible_regions.slice(0, 2).map((reg, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                        >
                          {reg}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Score pill */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 font-extrabold text-lg sm:text-xl shadow-xs ring-1 ${getScoreBadgeClass(
                        match.total_score
                      )}`}
                    >
                      <span>{match.total_score}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">MATCH</span>
                    </div>
                  </div>
                </div>

                {/* 5-Factor Alignment Scale */}
                <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-100 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Criteria Alignment Breakdown (5-Point Scale)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {criteria.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((idx) => (
                              <div
                                key={idx}
                                className={`h-1.5 w-2.5 rounded-xs ${
                                  idx <= item.val ? "bg-slate-800" : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-slate-900 w-5 text-right">{item.val}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WHY THIS MATCHES */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Why this matches</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/40 border border-emerald-100 rounded-lg p-3">
                    {match.explanation}
                  </p>
                </div>

                {/* WATCH OUT (if compliance caveats or risks exist) */}
                {match.risks && match.risks.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Watch out</span>
                    </div>
                    <div className="rounded-lg bg-amber-50/60 border border-amber-200/80 p-3">
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

                {/* Card Action Footer */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Deadline: <strong className="text-slate-800">{formatDeadlineDisplay(grant.deadline)}</strong>
                    </span>
                    <span>
                      Funding: <strong className="text-slate-800">{formatFundingRange(grant.funding_min, grant.funding_max, grant.currency)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={grant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>

                    <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                      <span>Full Criteria & Guidance</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grant Detail Slide-over / Modal */}
      {selectedMatch && (
        <GrantDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
