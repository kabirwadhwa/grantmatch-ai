import { SearchOptions, SearchProvider } from "../types";
import { SearchResultItem } from "../../../types";

export class SerperSearchProvider implements SearchProvider {
  name = "serper";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResultItem[]> {
    const limit = options.limit || 5;

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper search failed with status ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResultItem[] = [];

    if (Array.isArray(data.organic)) {
      for (const item of data.organic) {
        try {
          const urlObj = new URL(item.link);
          results.push({
            title: item.title || "Grant Opportunity",
            url: item.link,
            snippet: item.snippet || "",
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
