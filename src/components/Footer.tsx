import Link from "next/link";
import { ShieldAlert, ExternalLink, HeartHandshake } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">GrantMatch AI</span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Open Public Good</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-slate-500 leading-relaxed">
              GrantMatch AI is an open-source public-interest tool built by Capacité. It discovers, screens eligibility, and explains funding matches for non-governmental organizations worldwide.
            </p>
            <div className="mt-3">
              <a
                href="https://capacite-production.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
              >
                ← Back to Capacité
              </a>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Anti-hallucination guarantee: Every grant record links to its original source.</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/profile" className="hover:text-blue-600">
                  NGO Match Engine
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-blue-600">
                  Public Grant Repository
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-blue-600">
                  Scoring Methodology & Weights
                </Link>
              </li>
              <li>
                <a href="/api/health" target="_blank" className="hover:text-blue-600">
                  System Health API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Open Source & Standards</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <span className="text-slate-500">MIT License</span>
              </li>
              <li>
                <span className="text-slate-500">SSRF & Privacy Hardened</span>
              </li>
              <li>
                <span className="text-slate-500">Railway Ready</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8 text-xs text-slate-500">
          <p>
            <strong>Disclaimer:</strong> GrantMatch AI is an advisory matching tool intended to streamline discovery.
            Eligibility scores, requirements, and deadlines are inferred from public funder materials and deterministic logic.
            They do not constitute a formal guarantee of grant eligibility or funding. Always verify official criteria directly on the funder portal.
          </p>
        </div>
      </div>
    </footer>
  );
}
