import { SearchOptions, SearchProvider } from "../types";
import { SearchResultItem } from "../../../types";

// Real public funder programs and active open grant windows
const PUBLIC_FUNDER_DIRECTORIES: SearchResultItem[] = [
  {
    title: "Global Innovation Fund - Open Window for Social Innovation Grants",
    url: "https://www.globalinnovation.fund/apply/",
    snippet: "Apply for grant funding to scale evidence-backed innovations in health, education, and economic development in emerging markets.",
    sourceDomain: "globalinnovation.fund",
  },
  {
    title: "USAID Development Innovation Ventures (DIV) - Open Call for Proposals",
    url: "https://www.usaid.gov/div",
    snippet: "DIV awards grants to test and scale breakthrough solutions in low- and middle-income countries across all sectors.",
    sourceDomain: "usaid.gov",
  },
  {
    title: "Climate Justice Resilience Fund - Community-Led Climate Grants",
    url: "https://www.cjrfund.org/our-grants",
    snippet: "Grants supporting grassroots adaptation, indigenous resilience, and women-led initiatives in East Africa and South Asia.",
    sourceDomain: "cjrfund.org",
  },
  {
    title: "Ford Foundation - JustFutures and Civil Society Grants",
    url: "https://www.fordfoundation.org/work/our-grants/",
    snippet: "Funding non-profits and grassroots networks tackling inequality, civic participation, and social justice globally.",
    sourceDomain: "fordfoundation.org",
  },
  {
    title: "Wellcome Trust - Discovery Awards in Global Health",
    url: "https://wellcome.org/grant-funding/schemes/discovery-awards",
    snippet: "Open funding for institutions and civil society researching human health, infectious disease, and climate impact.",
    sourceDomain: "wellcome.org",
  },
  {
    title: "Google.org Impact Challenge - Technology for Social Impact",
    url: "https://impactchallenge.withgoogle.com/",
    snippet: "Grants and technical mentorship for non-profits leveraging technology, open source, and AI to address societal challenges.",
    sourceDomain: "impactchallenge.withgoogle.com",
  },
  {
    title: "Bill & Melinda Gates Foundation - Global Grand Challenges",
    url: "https://gcgh.grandchallenges.org/challenges",
    snippet: "Catalytic grant opportunities addressing critical barriers in maternal health, child nutrition, and infectious disease.",
    sourceDomain: "grandchallenges.org",
  },
  {
    title: "Rockefeller Foundation - Food Systems & Climate Resilience Grants",
    url: "https://www.rockefellerfoundation.org/grants/",
    snippet: "Supporting organizations advancing regenerative agriculture, clean energy access, and rural community nutrition.",
    sourceDomain: "rockefellerfoundation.org",
  },
  {
    title: "Malala Fund - Championing Girls' Secondary Education Grants",
    url: "https://malala.org/programmes",
    snippet: "Grants awarded to local feminist activists and community non-profits advancing 12 years of quality education for girls.",
    sourceDomain: "malala.org",
  },
  {
    title: "MacArthur Foundation - Grants for Justice and Independent Media",
    url: "https://www.macfound.org/programs/",
    snippet: "Funding civil society organizations advancing climate solutions, transparency, and criminal justice reform.",
    sourceDomain: "macfound.org",
  },
  {
    title: "Skoll Foundation - Catalyzing Transformational Social Change",
    url: "https://skoll.org/about/skoll-awards/",
    snippet: "Grants and investments in social innovators driving large-scale systemic solutions to poverty, healthcare, and environmental crises.",
    sourceDomain: "skoll.org",
  },
  {
    title: "European Commission DG INTPA - Civil Society & Local Authorities Calls",
    url: "https://international-partnerships.ec.europa.eu/funding-and-tender-opportunities_en",
    snippet: "Direct grant funding for civil society organizations and NGOs implementing local development and governance programs.",
    sourceDomain: "international-partnerships.ec.europa.eu",
  },
  {
    title: "Oak Foundation - International Human Rights & Environment Grants",
    url: "https://oakfnd.org/grant-making/",
    snippet: "Supporting civil society strengthening, environmental justice, child safety, and housing rights worldwide.",
    sourceDomain: "oakfnd.org",
  },
  {
    title: "UN Trust Fund to End Violence Against Women - Annual Grant Call",
    url: "https://untf.unwomen.org/en/grant-giving/call-for-proposals",
    snippet: "Global grant-making mechanism dedicated to funding civil society initiatives supporting women and girl survivors.",
    sourceDomain: "untf.unwomen.org",
  }
];

export class MockSearchProvider implements SearchProvider {
  name = "mock";

  async search(query: string, options: SearchOptions = {}): Promise<SearchResultItem[]> {
    const limit = options.limit || 5;
    const queryTokens = query
      .toLowerCase()
      .replace(/["']/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 3 && !["grant", "funding", "call", "proposals", "open", "2026", "2027"].includes(t));

    // Rank candidate items based on token matches in title or snippet
    const scored = PUBLIC_FUNDER_DIRECTORIES.map((item) => {
      let score = 0;
      const haystack = `${item.title} ${item.snippet} ${item.sourceDomain}`.toLowerCase();
      for (const token of queryTokens) {
        if (haystack.includes(token)) {
          score += 2;
        }
      }
      return { item, score };
    });

    // Sort by match score
    scored.sort((a, b) => b.score - a.score);

    // If no strong tokens matched, return a rotating diverse sample of funder pages
    const results = scored
      .filter((s) => s.score > 0)
      .map((s) => s.item);

    if (results.length > 0) {
      return results.slice(0, limit);
    }

    return PUBLIC_FUNDER_DIRECTORIES.slice(0, limit);
  }
}
