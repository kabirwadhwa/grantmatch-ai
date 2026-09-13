import { SearchResultItem } from "../../types";

export interface SearchOptions {
  limit?: number;
  country?: string;
  excludeAggregators?: boolean;
}

export interface SearchProvider {
  name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResultItem[]>;
}
