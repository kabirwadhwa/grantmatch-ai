import { NextRequest, NextResponse } from "next/server";
import { NGOProfile } from "@/types";
import { runLiveDiscoveryPipeline } from "@/lib/search/discovery-pipeline";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { llmService } from "@/lib/llm/provider";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Daily rate limit reached for live web discovery.",
          resetTime: new Date(rateCheck.resetTime).toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const ngo = body.ngo as NGOProfile;

    if (!ngo || !ngo.name) {
      return NextResponse.json({ error: "NGO profile is required for targeted live discovery." }, { status: 400 });
    }

    const result = await runLiveDiscoveryPipeline(ngo, ngo.id);

    return NextResponse.json({
      success: true,
      result,
      isDemoMode: llmService.isDemoMode(),
    });
  } catch (err: unknown) {
    console.error("Live discovery error:", err);
    const message = err instanceof Error ? err.message : "Error executing live discovery pipeline.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
