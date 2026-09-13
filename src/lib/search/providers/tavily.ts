import { SearchOptions, SearchProvider } from "../types";
import { SearchResultItem } from "../../../types";

export class TavilySearchProvider implements SearchProvider {
  name = "tavily";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResultItem[]> {
    const limit = options.limit || 5;

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: limit,
        exclude_domains: options.excludeAggregators
          ? ["fundsforngos.org", "linkedin.com", "facebook.com", "twitter.com", "instagram.com"]
          : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed with status ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResultItem[] = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results) {
        try {
          const urlObj = new URL(item.url);
          results.push({
            title: item.title || "Grant Opportunity",
            url: item.url,
            snippet: item.content || item.snippet || "",
            sourceDomain: urlObj.hostname.replace("www.", ""),
          });
        } catch {
          // skip invalid URL
        }
      }
    }

    return results;
  }
}
