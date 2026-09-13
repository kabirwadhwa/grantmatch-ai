export type RegistrationStatus =
  | "Registered Non-Profit"
  | "Community-Based Organization (CBO)"
  | "Non-Governmental Organization (NGO)"
  | "Charitable Trust / Foundation"
  | "Social Enterprise"
  | "Pending Registration"
  | "Other";

export interface NGOProfile {
  id?: string;
  name: string;
  website?: string;
  description: string;
  country: string;
  operating_regions: string[];
  themes: string[];
  beneficiaries: string[];
  annual_budget?: number | null;
  requested_funding_min?: number | null;
  requested_funding_max?: number | null;
  years_operating?: number | null;
  registration_status: RegistrationStatus | string;
  created_at?: Date;
}

export type GrantStatus = "active" | "expired" | "verified" | "needs_verification" | "demo";

export interface GrantOpportunity {
  id?: string;
  title: string;
  funder: string;
  url: string;
  description: string;
  funding_min?: number | null;
  funding_max?: number | null;
  currency: string;
  deadline?: Date | string | null;
  eligible_regions: string[];
  eligible_org_types: string[];
  themes: string[];
  beneficiaries: string[];
  requirements: string[];
  operating_history_required?: number | null;
  source_domain: string;
  discovered_at?: Date;
  last_checked_at?: Date;
  status: GrantStatus;
}

export interface ScoreBreakdown {
  thematic: number;       // 0 - 100 (weight: 30%)
  geographic: number;     // 0 - 100 (weight: 25%)
  eligibility: number;    // 0 - 100 (weight: 20%)
  funding_size: number;   // 0 - 100 (weight: 15%)
  beneficiary: number;    // 0 - 100 (weight: 10%)
}

export interface MatchEvaluation {
  id?: string;
  ngo_id?: string;
  grant_id?: string;
  total_score: number;    // 0 - 100
  breakdown: ScoreBreakdown;
  explanation: string;
  risks: string[];        // Specific potential blockers / eligibility caveats
  recommendation: string; // Recommended immediate next action
  grant?: GrantOpportunity;
  created_at?: Date;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  sourceDomain: string;
}

export interface ExtractedWebsiteContent {
  url: string;
  title: string;
  metaDescription?: string;
  headings: string[];
  text: string;
  pagesCrawled: number;
}
