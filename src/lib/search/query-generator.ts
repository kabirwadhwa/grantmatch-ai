import { NGOProfile } from "../../types";

/**
 * Generates 4-6 high-intent search queries designed to surface official funder pages
 * and calls for proposals rather than aggregators.
 */
export function generateDiscoveryQueries(ngo: NGOProfile): string[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const primaryTheme = ngo.themes[0] || "community development";
  const secondaryTheme = ngo.themes[1] || "";
  const country = ngo.country || "Global";
  const region = ngo.operating_regions[0] || country;
  const beneficiary = ngo.beneficiaries[0] || "underserved communities";

  const queries: string[] = [
    // Query 1: Year-specific thematic grant call in target country
    `${currentYear} OR ${nextYear} grant call for proposals NGO "${primaryTheme}" ${country}`,

    // Query 2: Regional foundation funding for primary theme & beneficiaries
    `foundation funding "${primaryTheme}" ${beneficiary} ${region} nonprofit`,

    // Query 3: International development organization open grant call
    `open call for proposals NGO "${primaryTheme}" ${country} grant funding`,

    // Query 4: Beneficiary-centric international grant
    `international grant funding "${beneficiary}" ${primaryTheme} ${region}`,
  ];

  // Query 5: If secondary theme exists, create cross-cutting query
  if (secondaryTheme) {
    queries.push(`civil society grant award "${secondaryTheme}" ${country} apply`);
  } else {
    queries.push(`development grant opportunity "${primaryTheme}" ${country} application`);
  }

  // Query 6: Trust / funder direct initiative
  queries.push(`call for applications nonprofit grant "${primaryTheme}" ${region}`);

  return queries.slice(0, 6);
}
