import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_GRANTS = [
  {
    title: "Global Innovation Fund (GIF) Open Window",
    funder: "Global Innovation Fund",
    url: "https://www.globalinnovation.fund/apply/",
    description: "GIF invests in social innovations that aim to improve the lives and opportunities of millions of people living on less than $5 a day in developing countries. We fund evidence-backed innovations across education, health, agriculture, and climate resilience.",
    funding_min: 50000,
    funding_max: 250000,
    currency: "USD",
    deadline: null, // Rolling
    eligible_regions: JSON.stringify(["Global", "Sub-Saharan Africa", "South Asia", "Latin America", "Developing Countries"]),
    eligible_org_types: JSON.stringify(["Non-Profit", "NGO", "Social Enterprise", "Community-Based Organization (CBO)"]),
    themes: JSON.stringify(["Poverty Alleviation", "Education", "Healthcare", "Agriculture", "Climate Resilience", "Innovation"]),
    beneficiaries: JSON.stringify(["Low-income populations", "Women and Girls", "Smallholder Farmers", "Youth"]),
    requirements: JSON.stringify([
      "Evidence of impact or rigorous pilot data",
      "Cost-effective solution capable of scaling",
      "Transparent governance and audited financials for organizations operating > 2 years"
    ]),
    operating_history_required: 2,
    source_domain: "globalinnovation.fund",
    status: "verified"
  },
  {
    title: "USAID Development Innovation Ventures (DIV) Stage 1: Proof of Concept",
    funder: "United States Agency for International Development (USAID)",
    url: "https://www.usaid.gov/div",
    description: "DIV provides open competition grant funding for breakthrough solutions to core global development challenges. Stage 1 supports early-stage piloting and feasibility testing in any low- or middle-income country.",
    funding_min: 50000,
    funding_max: 200000,
    currency: "USD",
    deadline: null, // Rolling year-round
    eligible_regions: JSON.stringify(["Global", "Developing Countries", "Sub-Saharan Africa", "Latin America", "Southeast Asia"]),
    eligible_org_types: JSON.stringify(["NGO", "Non-Profit", "Registered Non-Profit", "Higher Education Institution", "Private For-Profit"]),
    themes: JSON.stringify(["Economic Development", "Education", "Global Health", "Democracy & Governance", "Environment & Energy"]),
    beneficiaries: JSON.stringify(["Underserved communities", "Women and Girls", "Rural populations", "Youth"]),
    requirements: JSON.stringify([
      "Rigorous plan to measure causal impact",
      "Path to scale and commercial/public financial sustainability",
      "Compliance with standard USAID SAM.gov and UEI registration before final award"
    ]),
    operating_history_required: 1,
    source_domain: "usaid.gov",
    status: "verified"
  },
  {
    title: "Climate Justice Resilience Fund (CJRF) Community Grants",
    funder: "Climate Justice Resilience Fund",
    url: "https://www.cjrfund.org/our-grants",
    description: "CJRF supports grassroots organizations, women, youth, and indigenous peoples on the front lines of climate change to build community-led resilience, adaptation strategies, and loss and damage advocacy.",
    funding_min: 25000,
    funding_max: 150000,
    currency: "USD",
    deadline: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000), // ~65 days from now
    eligible_regions: JSON.stringify(["East Africa", "South Asia", "Arctic", "Sub-Saharan Africa", "Kenya", "Tanzania", "Bangladesh", "India"]),
    eligible_org_types: JSON.stringify(["Community-Based Organization (CBO)", "NGO", "Indigenous People's Organization", "Women-Led Organization"]),
    themes: JSON.stringify(["Climate & Environment", "Climate Adaptation", "Community Resilience", "Indigenous Rights", "Loss & Damage"]),
    beneficiaries: JSON.stringify(["Indigenous Peoples", "Women and Girls", "Rural Communities", "Youth"]),
    requirements: JSON.stringify([
      "Community-led and participatory decision-making structure",
      "Direct benefit to frontline climate-vulnerable communities",
      "Demonstrated presence in targeted geographical landscape"
    ]),
    operating_history_required: 1,
    source_domain: "cjrfund.org",
    status: "verified"
  },
  {
    title: "Wellcome Trust Discovery Awards: Improving Global Health Equity",
    funder: "Wellcome Trust",
    url: "https://wellcome.org/grant-funding/schemes/discovery-awards",
    description: "Funding for established researchers and collaborative civil society institutions addressing infectious disease, mental health, and climate impact on human health in low-resource settings.",
    funding_min: 100000,
    funding_max: 500000,
    currency: "USD",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // ~45 days
    eligible_regions: JSON.stringify(["Global", "Sub-Saharan Africa", "Latin America", "Southeast Asia", "UK"]),
    eligible_org_types: JSON.stringify(["Registered Non-Profit", "Research Institute", "University", "NGO"]),
    themes: JSON.stringify(["Healthcare", "Mental Health", "Infectious Diseases", "Climate & Health", "Public Health Research"]),
    beneficiaries: JSON.stringify(["Vulnerable patients", "Low-income urban communities", "Children", "Elderly"]),
    requirements: JSON.stringify([
      "Strong research or evidence-generation component",
      "Institutional sponsorship and compliance with ethics committee standards",
      "Minimum 3 years of audited operational accounts"
    ]),
    operating_history_required: 3,
    source_domain: "wellcome.org",
    status: "verified"
  },
  {
    title: "Ford Foundation JustFutures: Social Justice and Human Rights",
    funder: "Ford Foundation",
    url: "https://www.fordfoundation.org/work/our-grants/",
    description: "Supports organizations challenging inequality and defending civic space, labor rights, and gender equity across the Global South and the Americas.",
    funding_min: 75000,
    funding_max: 300000,
    currency: "USD",
    deadline: null, // Inquiries reviewed continuously
    eligible_regions: JSON.stringify(["Global", "Latin America", "West Africa", "East Africa", "South Asia", "United States"]),
    eligible_org_types: JSON.stringify(["Registered Non-Profit", "NGO", "Charitable Trust / Foundation"]),
    themes: JSON.stringify(["Human Rights", "Civic Participation", "Gender Equality", "Economic Justice", "Democracy"]),
    beneficiaries: JSON.stringify(["Marginalized Communities", "Women and Girls", "Workers", "Racial Minorities"]),
    requirements: JSON.stringify([
      "Clear human rights and anti-inequality strategic mission",
      "Valid non-profit or charitable tax-exempt status in country of incorporation",
      "Two years of governance and financial statements"
    ]),
    operating_history_required: 2,
    source_domain: "fordfoundation.org",
    status: "verified"
  },
  {
    title: "Google.org Impact Challenge: Tech for Sustainable Development",
    funder: "Google.org",
    url: "https://impactchallenge.withgoogle.com/",
    description: "Providing open funding and technical assistance to non-profit organizations utilizing open-source software, artificial intelligence, or data science to tackle environmental sustainability and digital inclusion.",
    funding_min: 150000,
    funding_max: 1000000,
    currency: "USD",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ~30 days
    eligible_regions: JSON.stringify(["Global", "Europe", "North America", "Latin America", "Asia-Pacific", "Africa"]),
    eligible_org_types: JSON.stringify(["Registered Non-Profit", "NGO", "Charity", "Social Enterprise"]),
    themes: JSON.stringify(["Technology for Impact", "Artificial Intelligence", "Climate & Environment", "Education", "Digital Inclusion"]),
    beneficiaries: JSON.stringify(["Youth", "Underrepresented Communities", "Educators", "Smallholder Communities"]),
    requirements: JSON.stringify([
      "Must commit to open-source or freely accessible public technology deliverables",
      "Recognized charitable/non-profit legal entity",
      "Clear feasibility assessment and technical architecture plan"
    ]),
    operating_history_required: 2,
    source_domain: "impactchallenge.withgoogle.com",
    status: "verified"
  },
  {
    title: "Bill & Melinda Gates Foundation: Grand Challenges in Global Health & Nutrition",
    funder: "Bill & Melinda Gates Foundation",
    url: "https://gcgh.grandchallenges.org/challenges",
    description: "Fosters innovation in global health and development. Grants target transformative solutions for maternal and child health, primary healthcare delivery, and malnutrition in low- and middle-income countries.",
    funding_min: 100000,
    funding_max: 500000,
    currency: "USD",
    deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    eligible_regions: JSON.stringify(["Global", "Sub-Saharan Africa", "South Asia", "Developing Countries"]),
    eligible_org_types: JSON.stringify(["NGO", "Research Institution", "Registered Non-Profit", "University"]),
    themes: JSON.stringify(["Healthcare", "Maternal Health", "Child Nutrition", "Disease Prevention", "Biomedical Innovation"]),
    beneficiaries: JSON.stringify(["Infants and Children", "Mothers", "Pregnant Women", "Rural Impoverished Populations"]),
    requirements: JSON.stringify([
      "Measurable public health efficacy model",
      "Explicit global access agreement (technologies must be made available affordably to low-income populations)",
      "Registered legal non-profit or research institution"
    ]),
    operating_history_required: 2,
    source_domain: "grandchallenges.org",
    status: "verified"
  },
  {
    title: "Rockefeller Foundation Climate & Food Security Initiative",
    funder: "The Rockefeller Foundation",
    url: "https://www.rockefellerfoundation.org/grants/",
    description: "Invests in regenerative agriculture, school nutrition supply chains, and renewable energy for rural communities across Africa and Asia.",
    funding_min: 100000,
    funding_max: 400000,
    currency: "USD",
    deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    eligible_regions: JSON.stringify(["Sub-Saharan Africa", "East Africa", "West Africa", "South Asia", "Kenya", "Nigeria", "Rwanda", "India"]),
    eligible_org_types: JSON.stringify(["NGO", "Non-Profit", "Civil Society Organization", "Agricultural Cooperative"]),
    themes: JSON.stringify(["Agriculture & Food Security", "Climate & Environment", "Renewable Energy", "Nutrition"]),
    beneficiaries: JSON.stringify(["Smallholder Farmers", "School Children", "Rural Households", "Women Farmers"]),
    requirements: JSON.stringify([
      "Proven local network and community engagement",
      "Demonstrated capacity for project financial tracking and reporting",
      "Minimum 2 years operational track record"
    ]),
    operating_history_required: 2,
    source_domain: "rockefellerfoundation.org",
    status: "verified"
  },
  {
    title: "Malala Fund Girls' Education Programme",
    funder: "Malala Fund",
    url: "https://malala.org/programmes",
    description: "Championing 12 years of free, safe, quality education for all girls. The programme awards grants to local feminist activists and non-profits in countries where girls face the steepest barriers to secondary education.",
    funding_min: 20000,
    funding_max: 100000,
    currency: "USD",
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    eligible_regions: JSON.stringify(["East Africa", "West Africa", "South Asia", "Latin America", "Kenya", "Nigeria", "Pakistan", "India", "Ethiopia", "Tanzania"]),
    eligible_org_types: JSON.stringify(["NGO", "Community-Based Organization (CBO)", "Women-Led Organization", "Registered Non-Profit"]),
    themes: JSON.stringify(["Education", "Girls' Education", "Gender Equality", "Youth Empowerment", "Advocacy"]),
    beneficiaries: JSON.stringify(["Adolescent Girls", "Young Women", "Refugee Girls", "Rural Schoolchildren"]),
    requirements: JSON.stringify([
      "Must be locally registered in target country or operating as recognized grassroots community organization",
      "Direct work in secondary education access, retention, or gender-based violence mitigation",
      "Child safeguarding policy in place"
    ]),
    operating_history_required: 1,
    source_domain: "malala.org",
    status: "verified"
  },
  {
    title: "MacArthur Foundation Civic Research and Justice Grant",
    funder: "John D. and Catherine T. MacArthur Foundation",
    url: "https://www.macfound.org/programs/",
    description: "Supports independent public interest media, transparency initiatives, criminal justice reform, and climate solutions led by non-profit civil society.",
    funding_min: 100000,
    funding_max: 350000,
    currency: "USD",
    deadline: null,
    eligible_regions: JSON.stringify(["Global", "United States", "Nigeria", "India", "Mexico"]),
    eligible_org_types: JSON.stringify(["Registered Non-Profit", "NGO", "Independent Media Organization"]),
    themes: JSON.stringify(["Human Rights", "Civic Participation", "Media & Information", "Transparency & Anti-Corruption"]),
    beneficiaries: JSON.stringify(["General Public", "Journalists", "Vulnerable Communities", "Youth"]),
    requirements: JSON.stringify([
      "Commitment to independent editorial and investigative standards",
      "Financial stability with at least 3 years operational existence",
      "Documented public benefit"
    ]),
    operating_history_required: 3,
    source_domain: "macfound.org",
    status: "verified"
  },
  {
    title: "Skoll Foundation Award for Social Innovation",
    funder: "Skoll Foundation",
    url: "https://skoll.org/about/skoll-awards/",
    description: "Awards catalytic funding to proven social entrepreneurs and civil society leaders driving large-scale systemic change in health, environmental sustainability, economic inclusion, and peace.",
    funding_min: 250000,
    funding_max: 750000,
    currency: "USD",
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    eligible_regions: JSON.stringify(["Global", "Sub-Saharan Africa", "Latin America", "Asia-Pacific"]),
    eligible_org_types: JSON.stringify(["Registered Non-Profit", "NGO", "Social Enterprise"]),
    themes: JSON.stringify(["Poverty Alleviation", "Healthcare", "Climate Resilience", "Economic Opportunity", "Innovation"]),
    beneficiaries: JSON.stringify(["Marginalized Communities", "Low-Income Households", "Youth"]),
    requirements: JSON.stringify([
      "Track record of measurable systemic impact across minimum 3 years",
      "Annual operating budget exceeding $250,000",
      "Clear expansion or national replication model"
    ]),
    operating_history_required: 3,
    source_domain: "skoll.org",
    status: "verified"
  },
  {
    title: "European Commission Civil Society & Local Authorities Fund",
    funder: "European Commission (DG INTPA)",
    url: "https://international-partnerships.ec.europa.eu/funding-and-tender-opportunities_en",
    description: "Supports civil society organizations in partner countries to strengthen local governance, social protection, youth employment, and human rights monitoring.",
    funding_min: 75000,
    funding_max: 300000,
    currency: "EUR",
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    eligible_regions: JSON.stringify(["Global", "Sub-Saharan Africa", "North Africa", "Latin America", "Central Asia"]),
    eligible_org_types: JSON.stringify(["Registered Non-Profit", "NGO", "Community-Based Organization (CBO)"]),
    themes: JSON.stringify(["Governance", "Human Rights", "Youth Empowerment", "Economic Opportunity", "Social Protection"]),
    beneficiaries: JSON.stringify(["Unemployed Youth", "Women", "Local Communities", "Displaced Persons"]),
    requirements: JSON.stringify([
      "Registered in eligible partner country or EU member state for at least 2 years",
      "Capacity to manage international grant accounting in accordance with EC PRAG regulations",
      "PADOR registration completed"
    ]),
    operating_history_required: 2,
    source_domain: "international-partnerships.ec.europa.eu",
    status: "verified"
  }
];

async function main() {
  console.log("Seeding GrantMatch AI database with realistic public grants...");

  for (const grantData of SAMPLE_GRANTS) {
    await prisma.grant.upsert({
      where: { url: grantData.url },
      update: {
        title: grantData.title,
        funder: grantData.funder,
        description: grantData.description,
        funding_min: grantData.funding_min,
        funding_max: grantData.funding_max,
        currency: grantData.currency,
        deadline: grantData.deadline,
        eligible_regions: grantData.eligible_regions,
        eligible_org_types: grantData.eligible_org_types,
        themes: grantData.themes,
        beneficiaries: grantData.beneficiaries,
        requirements: grantData.requirements,
        operating_history_required: grantData.operating_history_required,
        source_domain: grantData.source_domain,
        status: grantData.status,
        last_checked_at: new Date()
      },
      create: grantData,
    });
  }

  const count = await prisma.grant.count();
  console.log(`Successfully seeded ${count} grants in GrantMatch database.`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
