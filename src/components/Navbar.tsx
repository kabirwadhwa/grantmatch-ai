import Link from "next/link";
import { ShieldCheck, Compass, BookOpen, Layers } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#315C4C] text-white shadow-xs">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  GrantMatch <span className="font-semibold text-[#315C4C]">AI</span>
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-500 leading-none mt-0.5">
                by{" "}
                <a
                  href="https://capacite-production.up.railway.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-700 hover:text-[#315C4C] underline underline-offset-2"
                >
                  Capacité
                </a>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <Compass className="h-4 w-4 text-slate-500" />
            <span>Find Funding</span>
          </Link>

          <Link
            href="/directory"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:flex"
          >
            <Layers className="h-4 w-4 text-slate-500" />
            <span>Grant Directory</span>
          </Link>

          <Link
            href="/methodology"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <BookOpen className="h-4 w-4 text-slate-500" />
            <span>Methodology</span>
          </Link>

          <div className="ml-2 hidden h-5 w-[1px] bg-slate-200 lg:block" />

          <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 lg:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Official URLs Only</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
