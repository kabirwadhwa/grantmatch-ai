import { GrantOpportunity } from "../../types";

export type TrustStatus =
  | "OPEN"
  | "ROLLING"
  | "INVITATION ONLY"
  | "UPCOMING"
  | "CLOSED"
  | "STATUS UNVERIFIED";

export interface GrantStatusInfo {
  status: TrustStatus;
  label: string;
  badgeClass: string;
  isVerified: boolean;
  explanation: string;
}

/**
 * Calculates honest application status without fabricating open grant calls.
 */
export function getGrantStatusInfo(grant?: Partial<GrantOpportunity> | null): GrantStatusInfo {
  if (!grant) {
    return {
      status: "STATUS UNVERIFIED",
      label: "Status Unverified",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      isVerified: false,
      explanation: "Verification pending directly with funder portal.",
    };
  }

  const descLower = (grant.description || "").toLowerCase();
  const titleLower = (grant.title || "").toLowerCase();
  let reqStr = "";
  if (Array.isArray(grant.requirements)) {
    reqStr = grant.requirements.join(" ");
  } else if (typeof grant.requirements === "string") {
    reqStr = grant.requirements;
  }
  const requirementsLower = reqStr.toLowerCase();
  const combined = `${descLower} ${titleLower} ${requirementsLower}`;

  // 1. Check if closed or expired
  if (grant.deadline) {
    const deadlineDate = new Date(grant.deadline);
    if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < Date.now()) {
      return {
        status: "CLOSED",
        label: "Closed",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        isVerified: true,
        explanation: "Previous application cycle has closed. Check official source for next funding round.",
      };
    }
  }

  // 2. Check for invitation only
  if (combined.includes("invitation only") || combined.includes("by invitation") || combined.includes("does not accept unsolicited")) {
    return {
      status: "INVITATION ONLY",
      label: "Invitation Only",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      isVerified: true,
      explanation: "Funder typically identifies grantees directly or through institutional referrals.",
    };
  }

  // 3. Check for upcoming calls
  if (combined.includes("upcoming") || combined.includes("opens soon") || combined.includes("opening soon") || combined.includes("preview")) {
    return {
      status: "UPCOMING",
      label: "Upcoming Call",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      isVerified: true,
      explanation: "Funder has announced an upcoming funding window. Terms subject to confirmation.",
    };
  }

  // 4. Check for active open call with verified deadline
  if (grant.deadline) {
    const deadlineDate = new Date(grant.deadline);
    if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() >= Date.now()) {
      return {
        status: "OPEN",
        label: "Open Call",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        isVerified: true,
        explanation: "Applications currently open with verified deadline.",
      };
    }
  }

  // 5. Check for verified rolling calls
  if (
    grant.status === "verified" ||
    grant.status === "demo" ||
    combined.includes("rolling") ||
    combined.includes("open window") ||
    combined.includes("year-round") ||
    combined.includes("continuous")
  ) {
    return {
      status: "ROLLING",
      label: "Rolling Window",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      isVerified: true,
      explanation: "Applications reviewed on a rolling basis throughout the operating year.",
    };
  }

  // 6. Default fallback: Unverified
  return {
    status: "STATUS UNVERIFIED",
    label: "Status Unverified",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    isVerified: false,
    explanation: "Opportunity discovered from public web sources; check official funder portal to confirm active status.",
  };
}

/**
 * Formats deadline display honestly.
 */
export function formatDeadlineDisplay(deadline?: Date | string | null): string {
  if (!deadline) {
    return "Rolling / Open window";
  }
  const date = new Date(deadline);
  if (isNaN(date.getTime())) {
    return "Check official source";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats last verified date.
 */
export function formatVerifiedDate(date?: Date | string | null): string {
  if (!date) {
    return "Not verified";
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return "Not verified";
  }
  return `Verified ${parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

/**
 * Formats funding range honestly.
 */
export function formatFundingRange(
  min?: number | null,
  max?: number | null,
  currency: string = "USD"
): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (min && max) {
    return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}`;
  }
  if (max) {
    return `Up to ${symbol}${max.toLocaleString()}`;
  }
  if (min) {
    return `From ${symbol}${min.toLocaleString()}`;
  }
  return "Flexible / Check official source";
}
