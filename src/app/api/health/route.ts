import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { llmService } from "@/lib/llm/provider";
import { getSearchProvider } from "@/lib/search/providers/factory";

export async function GET() {
  let dbStatus = "connected";
  let grantsCount = 0;

  try {
    grantsCount = await prisma.grant.count();
  } catch (err) {
    dbStatus = "disconnected";
    console.error("Health check DB error:", err);
  }

  const searchProvider = getSearchProvider();

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      grantsCount,
    },
    llm: {
      provider: llmService.getProviderDisplayName(),
      isDemoMode: llmService.isDemoMode(),
    },
    search: {
      provider: searchProvider.name,
    },
    version: "1.0.0",
  });
}
