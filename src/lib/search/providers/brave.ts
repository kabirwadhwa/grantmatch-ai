import { SearchOptions, SearchProvider } from "../types";
import { SearchResultItem } from "../../../types";

export class BraveSearchProvider implements SearchProvider {
  name = "brave";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResultItem[]> {
    const limit = options.limit || 5;

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave search failed with status ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResultItem[] = [];

    if (data.web && Array.isArray(data.web.results)) {
      for (const item of data.web.results) {
        try {
          const urlObj = new URL(item.url);
          results.push({
            title: item.title || "Grant Opportunity",
            url: item.url,
            snippet: item.description || "",
            sourceDomain: urlObj.hostname.replace("www.", ""),
          });
        } catch {
          // ignore
        }
      }
    }

    return results;
  }
}
