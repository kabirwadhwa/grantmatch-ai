import { extractGrantHeuristically } from "../src/lib/scraper/grant-extractor";
import { extractNgoProfileHeuristically } from "../src/lib/scraper/ngo-extractor";

describe("Validation & Extraction Heuristics", () => {
  it("rejects non-grant pages that do not mention funding or proposals", () => {
    const nonGrantHtml = `
      <html>
        <head><title>About Our Corporate Software</title></head>
        <body><p>We sell cloud enterprise ERP software to large organizations.</p></body>
      </html>
    `;
    const result = extractGrantHeuristically(nonGrantHtml, "https://saas-vendor.com/about");
    expect(result).toBeNull();
  });

  it("extracts grant details and recognizes funding amounts", () => {
    const grantHtml = `
      <html>
        <head><title>Youth Leadership Fellowship Grant</title></head>
        <body>
          <h1>Youth Leadership Fellowship Grant</h1>
          <p>We offer financial support and grants of $50,000 to $150,000 for local youth organizations.</p>
        </body>
      </html>
    `;
    const result = extractGrantHeuristically(grantHtml, "https://fellowship-fund.org/apply");
    expect(result).not.toBeNull();
    expect(result?.title).toContain("Youth Leadership Fellowship Grant");
    expect(result?.funding_min).toBe(50000);
    expect(result?.funding_max).toBe(150000);
  });

  it("extracts NGO profile attributes from website text", () => {
    const content = {
      url: "https://kenyaeducate.org",
      title: "Kenya Educate Foundation - Empowering Girls Through STEM",
      metaDescription: "Providing secondary scholarships and digital education in Kenya since 2018.",
      headings: ["Our Mission", "Programs"],
      text: "Founded in 2018, Kenya Educate works across Kenya and East Africa to provide education for women and girls.",
      pagesCrawled: 2,
    };

    const profile = extractNgoProfileHeuristically(content);
    expect(profile.country).toBe("Kenya");
    expect(profile.themes).toContain("Education");
    expect(profile.beneficiaries).toContain("Women and Girls");
    expect(profile.years_operating).toBeGreaterThanOrEqual(5);
  });
});
