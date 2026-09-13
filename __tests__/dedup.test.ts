import { canonicalizeUrl, isBlacklistedDomain } from "../src/lib/search/discovery-pipeline";

describe("Discovery Pipeline - Deduplication & Blacklist Filtering", () => {
  it("removes query parameters, utm tags, fragments, and trailing slashes", () => {
    const raw = "https://www.funder.org/grants/call-2026/?utm_source=newsletter&utm_medium=email&ref=home#apply";
    const canonical = canonicalizeUrl(raw);
    expect(canonical).toBe("https://www.funder.org/grants/call-2026");
  });

  it("normalizes identical URLs with different query orders", () => {
    const url1 = "https://funder.org/apply?utm_campaign=winter&utm_source=twitter/";
    const url2 = "https://funder.org/apply?utm_source=twitter&utm_campaign=winter";

    expect(canonicalizeUrl(url1)).toBe("https://funder.org/apply");
    expect(canonicalizeUrl(url2)).toBe("https://funder.org/apply");
  });

  it("identifies and blocks known social media and scraper aggregator domains", () => {
    expect(isBlacklistedDomain("facebook.com")).toBe(true);
    expect(isBlacklistedDomain("twitter.com")).toBe(true);
    expect(isBlacklistedDomain("wikipedia.org")).toBe(true);
    expect(isBlacklistedDomain("fordfoundation.org")).toBe(false);
    expect(isBlacklistedDomain("globalinnovation.fund")).toBe(false);
  });
});
