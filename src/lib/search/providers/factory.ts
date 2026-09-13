import { SearchProvider } from "../types";
import { TavilySearchProvider } from "./tavily";
import { SerperSearchProvider } from "./serper";
import { BraveSearchProvider } from "./brave";
import { MockSearchProvider } from "./mock-provider";

export function getSearchProvider(): SearchProvider {
  const providerType = (process.env.SEARCH_PROVIDER || "mock").toLowerCase().trim();
  const apiKey = process.env.SEARCH_API_KEY || "";

  if (providerType === "tavily" && apiKey) {
    return new TavilySearchProvider(apiKey);
  }

  if (providerType === "serper" && apiKey) {
    return new SerperSearchProvider(apiKey);
  }

  if (providerType === "brave" && apiKey) {
    return new BraveSearchProvider(apiKey);
  }

  // Fallback to mock / curated search provider
  return new MockSearchProvider();
}
