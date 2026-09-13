import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GrantOpportunity } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme");
    const country = searchParams.get("country");
    const query = searchParams.get("q");

    const grants = await prisma.grant.findMany({
      orderBy: { discovered_at: "desc" },
      take: 50,
    });

    const parsed: GrantOpportunity[] = grants.map((g) => ({
      id: g.id,
      title: g.title,
      funder: g.funder,
      url: g.url,
      description: g.description,
      funding_min: g.funding_min,
      funding_max: g.funding_max,
      currency: g.currency,
      deadline: g.deadline,
      eligible_regions: JSON.parse(g.eligible_regions),
      eligible_org_types: JSON.parse(g.eligible_org_types),
      themes: JSON.parse(g.themes),
      beneficiaries: JSON.parse(g.beneficiaries),
      requirements: JSON.parse(g.requirements),
      operating_history_required: g.operating_history_required,
      source_domain: g.source_domain,
      status: g.status as any,
      discovered_at: g.discovered_at,
      last_checked_at: g.last_checked_at,
    }));

    let filtered = parsed;

    if (query) {
      const qLower = query.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(qLower) ||
          g.funder.toLowerCase().includes(qLower) ||
          g.description.toLowerCase().includes(qLower)
      );
    }

    if (theme) {
      filtered = filtered.filter((g) =>
        g.themes.some((t) => t.toLowerCase().includes(theme.toLowerCase()))
      );
    }

    if (country) {
      filtered = filtered.filter((g) =>
        g.eligible_regions.some(
          (r) =>
            r.toLowerCase().includes(country.toLowerCase()) ||
            r.toLowerCase().includes("global") ||
            r.toLowerCase().includes("developing")
        )
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      grants: filtered,
    });
  } catch (err: unknown) {
    console.error("Error fetching grants:", err);
    return NextResponse.json({ error: "Failed to fetch grants." }, { status: 500 });
  }
}
