/**
 * SEO overrides for high-value location pages.
 * Extracted from StandardizedLocationPage to keep the component focused on rendering.
 */

export const STRIKING_DISTANCE_CITY_SLUGS = [
  'new-york',
  'los-angeles',
  'chicago',
  'houston',
  'phoenix',
  'philadelphia',
  'san-francisco',
  'seattle',
  'denver',
  'boston',
  'dallas',
  'austin',
  'san-antonio',
  'san-diego',
  'san-jose',
  'nashville',
  'portland',
  'las-vegas',
  'atlanta',
  'miami',
  'minneapolis',
  'new-orleans',
  'cleveland',
  'st-louis',
  'pittsburgh',
  'cincinnati',
  'kansas-city',
  'columbus',
  'indianapolis',
  'jacksonville',
  'sacramento',
  'richmond',
  'washington-dc',
  'salt-lake-city',
  'santa-fe',
  'palm-beach',
  'aspen',
] as const;

export type LocationSeoOverride = {
  title: string;
  description: string;
  h1: string;
  heroDescription: string;
};

export const LOCATION_SEO_OVERRIDES: Partial<
  Record<(typeof STRIKING_DISTANCE_CITY_SLUGS)[number], LocationSeoOverride>
> = {
  'new-york': {
    title: 'New York Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare New York art appraisers and art appraisal services for estate planning, insurance, donation, and resale valuations. Review local NYC experts and online options.',
    h1: 'New York Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare New York City art appraisers for paintings, fine art, and collections, then choose local in-person service or online turnaround.',
  },
  'los-angeles': {
    title: 'Los Angeles Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Los Angeles art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local experts and online options.',
    h1: 'Los Angeles Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Los Angeles specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'chicago': {
    title: 'Chicago Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Chicago art appraisers and art appraisal services for estate planning, charitable donation, insurance, and resale valuations.',
    h1: 'Chicago Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Chicago art appraisers for paintings, prints, and collections, then choose local in-person service or a faster online appraisal route.',
  },
  'houston': {
    title: 'Houston Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Houston art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Texas experts and online options.',
    h1: 'Houston Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Houston specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'phoenix': {
    title: 'Phoenix Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Phoenix art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Arizona experts and online options.',
    h1: 'Phoenix Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Phoenix specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'philadelphia': {
    title: 'Philadelphia Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Philadelphia art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local experts and online options.',
    h1: 'Philadelphia Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Philadelphia specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'san-francisco': {
    title: 'San Francisco Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare San Francisco art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local experts and online options.',
    h1: 'San Francisco Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare San Francisco art appraisers for fine art and collections, then choose local in-person service or faster online appraisal.',
  },
  'seattle': {
    title: 'Seattle Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Seattle art appraisers and art appraisal services for estate planning, insurance, donation, and resale valuation. Check specialties and request support.',
    h1: 'Seattle Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Find Seattle art appraisal specialists for paintings, prints, and collections, then choose local in-person or online valuation support.',
  },
  'denver': {
    title: 'Denver Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Denver art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local experts and online options.',
    h1: 'Denver Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Denver specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'boston': {
    title: 'Boston Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Boston art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Massachusetts experts and online options.',
    h1: 'Boston Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Boston art appraisers for fine art and collections, then choose local in-person service or faster online appraisal.',
  },
  'dallas': {
    title: 'Dallas Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Dallas art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Texas experts and online options.',
    h1: 'Dallas Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Dallas specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'austin': {
    title: 'Austin Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Austin art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review specialties and choose local or online.',
    h1: 'Austin Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Find Austin art appraisers for paintings, prints, and collections, then choose local appointments or online turnaround.',
  },
  'nashville': {
    title: 'Nashville Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Nashville art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Tennessee experts and online options.',
    h1: 'Nashville Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Nashville specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'las-vegas': {
    title: 'Las Vegas Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Las Vegas art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Nevada experts and online options.',
    h1: 'Las Vegas Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Las Vegas specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'atlanta': {
    title: 'Atlanta Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Atlanta art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Georgia experts and online options.',
    h1: 'Atlanta Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Atlanta specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'miami': {
    title: 'Miami Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Miami art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Florida experts and online options.',
    h1: 'Miami Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Miami specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'minneapolis': {
    title: 'Minneapolis Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Minneapolis art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review credentials and specialties.',
    h1: 'Minneapolis Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Find Minneapolis art appraisal specialists, then choose local in-person appointments or online support.',
  },
  'new-orleans': {
    title: 'New Orleans Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare New Orleans art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local Louisiana experts and online options.',
    h1: 'New Orleans Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare New Orleans specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'cleveland': {
    title: 'Cleveland Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Cleveland art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations. Review local experts and online options.',
    h1: 'Cleveland Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Cleveland specialists for art appraisals, then choose the right fit for estate, donation, insurance, and personal-property needs.',
  },
  'pittsburgh': {
    title: 'Pittsburgh Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Pittsburgh art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations. Review local experts and online options.',
    h1: 'Pittsburgh Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Pittsburgh specialists for art appraisals, then choose the right fit for estate, donation, insurance, and personal-property needs.',
  },
  'cincinnati': {
    title: 'Cincinnati Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Cincinnati art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations.',
    h1: 'Cincinnati Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Review Cincinnati art appraisal options, then choose local in-person service or online appraisal support.',
  },
  'kansas-city': {
    title: 'Kansas City Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Kansas City art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations. Review local experts and online options.',
    h1: 'Kansas City Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Kansas City specialists for art appraisals, then choose the right fit for estate, donation, insurance, and personal-property needs.',
  },
  'columbus': {
    title: 'Columbus Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Columbus art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations. Review local experts and online options.',
    h1: 'Columbus Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Columbus art appraisal experts for donation, estate, insurance, and personal-property needs before choosing local in-person or online service.',
  },
  'indianapolis': {
    title: 'Indianapolis Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Indianapolis art appraisers and art appraisal services for donation, estate, insurance, and resale valuation. Review local providers and online options.',
    h1: 'Indianapolis Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Review Indianapolis art appraisers, then choose the best local or online valuation route for your timeline.',
  },
  'jacksonville': {
    title: 'Jacksonville Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Jacksonville art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations. Review local Florida experts and online options.',
    h1: 'Jacksonville Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Jacksonville specialists for art appraisals, then choose the right fit for estate, donation, insurance, and personal-property needs.',
  },
  'sacramento': {
    title: 'Sacramento Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Sacramento art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local and online options.',
    h1: 'Sacramento Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Sacramento art appraisers, then choose local appointments or faster online appraisal.',
  },
  'richmond': {
    title: 'Richmond Art Appraisers & Art Appraisal Services | Estate, Donation, Insurance',
    description:
      'Compare Richmond art appraisers and art appraisal services for estate, donation, insurance, and personal-property valuations. Review local Virginia experts and online options.',
    h1: 'Richmond Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Richmond specialists for art appraisals, then choose the right fit for estate, donation, insurance, and personal-property needs.',
  },
  'washington-dc': {
    title: 'Washington DC Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Washington DC art appraisers and art appraisal services for estate, insurance, donation, and personal-property valuations. Review local experts and online options.',
    h1: 'Washington DC Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Washington DC specialists for art appraisals, then choose the right fit for estate, insurance, donation, and personal-property needs.',
  },
  'santa-fe': {
    title: 'Santa Fe Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Santa Fe art appraisers and art appraisal services for estate, insurance, donation, and collection valuations. Review local New Mexico experts and online options.',
    h1: 'Santa Fe Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Santa Fe specialists for fine art and collection appraisals, then choose local in-person service or online turnaround.',
  },
  'palm-beach': {
    title: 'Palm Beach Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Palm Beach art appraisers and art appraisal services for estate, insurance, donation, and collection valuations. Review local Florida experts and online options.',
    h1: 'Palm Beach Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Palm Beach specialists for fine art and collection appraisals, then choose local in-person service or online turnaround.',
  },
  'aspen': {
    title: 'Aspen Art Appraisers & Art Appraisal Services | Estate, Insurance, Donation',
    description:
      'Compare Aspen art appraisers and art appraisal services for estate, insurance, donation, and collection valuations. Review local Colorado experts and online options.',
    h1: 'Aspen Art Appraisers & Art Appraisal Services',
    heroDescription:
      'Compare Aspen specialists for fine art and collection appraisals, then choose local in-person service or online turnaround.',
  },
};

export const LOCATION_INTERNAL_LINK_TARGETS: Partial<
  Record<(typeof STRIKING_DISTANCE_CITY_SLUGS)[number], readonly string[]>
> = {
  'new-york': ['philadelphia', 'boston', 'hartford'],
  'los-angeles': ['san-diego', 'san-francisco', 'san-jose'],
  chicago: ['indianapolis', 'columbus', 'cleveland'],
  houston: ['dallas', 'san-antonio', 'austin'],
  phoenix: ['denver', 'las-vegas', 'los-angeles'],
  philadelphia: ['new-york', 'pittsburgh', 'washington-dc'],
  'san-francisco': ['san-jose', 'sacramento', 'los-angeles'],
  seattle: ['portland', 'san-francisco', 'denver'],
  denver: ['aspen', 'kansas-city', 'salt-lake-city'],
  boston: ['providence', 'hartford', 'new-york'],
  dallas: ['fort-worth', 'houston', 'austin'],
  austin: ['san-antonio', 'houston', 'dallas'],
  'san-antonio': ['austin', 'houston', 'dallas'],
  'san-diego': ['los-angeles', 'phoenix', 'las-vegas'],
  nashville: ['atlanta', 'indianapolis', 'charlotte'],
  portland: ['seattle', 'san-francisco', 'sacramento'],
  'las-vegas': ['phoenix', 'los-angeles', 'denver'],
  atlanta: ['savannah', 'charleston', 'charlotte'],
  miami: ['palm-beach', 'jacksonville', 'savannah'],
  minneapolis: ['chicago', 'indianapolis', 'kansas-city'],
  'new-orleans': ['houston', 'nashville', 'jacksonville'],
  cleveland: ['columbus', 'cincinnati', 'pittsburgh'],
  'st-louis': ['kansas-city', 'chicago', 'indianapolis'],
  pittsburgh: ['cleveland', 'columbus', 'philadelphia'],
  cincinnati: ['columbus', 'indianapolis', 'cleveland'],
  'kansas-city': ['st-louis', 'chicago', 'denver'],
  columbus: ['cleveland', 'cincinnati', 'pittsburgh'],
  indianapolis: ['columbus', 'cincinnati', 'chicago'],
  jacksonville: ['miami', 'savannah', 'palm-beach'],
  sacramento: ['san-francisco', 'san-jose', 'los-angeles'],
  richmond: ['washington-dc', 'charlotte', 'raleigh'],
  'washington-dc': ['richmond', 'philadelphia', 'charlotte'],
  'salt-lake-city': ['denver', 'phoenix', 'las-vegas'],
  'santa-fe': ['denver', 'phoenix', 'aspen'],
  'palm-beach': ['miami', 'jacksonville', 'savannah'],
  aspen: ['denver', 'salt-lake-city', 'santa-fe'],
};

export const ART_GUIDE_LINKS = [
  { slug: 'chinese-art-appraisal', label: 'Chinese Art Appraisal Guide' },
  { slug: 'fine-art-appraisal', label: 'Fine Art Appraisal Guide' },
  { slug: 'how-much-is-my-art-worth', label: 'How Much Is My Art Worth?' },
  { slug: 'artwork-value-estimate', label: 'Artwork Value Estimate' },
  { slug: 'valuation-of-art', label: 'Valuation Of Art' },
  { slug: 'what-gives-art-value', label: 'What Gives Art Value?' },
] as const;
