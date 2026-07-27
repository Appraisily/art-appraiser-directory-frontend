import allCitiesData from './cities.json';
import cityPublicationDecisions from '../../data/city-publication-decisions.json';

export type DirectoryCity = {
  name: string;
  state: string;
  slug: string;
  latitude: number;
  longitude: number;
};

const publishedSlugs = new Set(
  cityPublicationDecisions.cities
    .filter((city) => city.status === 'retained')
    .map((city) => city.slug)
);

export const publishedCities = allCitiesData.cities
  .filter((city) => publishedSlugs.has(city.slug))
  .map((city) => ({
    ...city,
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
  }))
  .filter(
    (city): city is DirectoryCity =>
      Number.isFinite(city.latitude) && Number.isFinite(city.longitude)
  )
  .sort((left, right) => left.name.localeCompare(right.name));

export const publishedCitySlugs = new Set(publishedCities.map((city) => city.slug));

const REGION_BY_STATE: Record<string, string> = {
  Alabama: 'Southeast',
  Alaska: 'West',
  Arizona: 'Southwest',
  Arkansas: 'Southeast',
  California: 'West',
  Colorado: 'Mountain',
  Connecticut: 'Northeast',
  Delaware: 'Northeast',
  'District of Columbia': 'Northeast',
  Florida: 'Southeast',
  Georgia: 'Southeast',
  Hawaii: 'West',
  Idaho: 'Mountain',
  Illinois: 'Midwest',
  Indiana: 'Midwest',
  Iowa: 'Midwest',
  Kansas: 'Midwest',
  Kentucky: 'Southeast',
  Louisiana: 'Southeast',
  Maine: 'Northeast',
  Maryland: 'Northeast',
  Massachusetts: 'Northeast',
  Michigan: 'Midwest',
  Minnesota: 'Midwest',
  Mississippi: 'Southeast',
  Missouri: 'Midwest',
  Montana: 'Mountain',
  Nebraska: 'Midwest',
  Nevada: 'West',
  'New Hampshire': 'Northeast',
  'New Jersey': 'Northeast',
  'New Mexico': 'Southwest',
  'New York': 'Northeast',
  'North Carolina': 'Southeast',
  'North Dakota': 'Midwest',
  Ohio: 'Midwest',
  Oklahoma: 'Southwest',
  Oregon: 'West',
  Pennsylvania: 'Northeast',
  'Rhode Island': 'Northeast',
  'South Carolina': 'Southeast',
  'South Dakota': 'Midwest',
  Tennessee: 'Southeast',
  Texas: 'Southwest',
  Utah: 'Mountain',
  Vermont: 'Northeast',
  Virginia: 'Southeast',
  Washington: 'West',
  'West Virginia': 'Southeast',
  Wisconsin: 'Midwest',
  Wyoming: 'Mountain',
};

export function groupPublishedCitiesByRegion(
  cities: DirectoryCity[] = publishedCities
): Record<string, DirectoryCity[]> {
  return cities.reduce<Record<string, DirectoryCity[]>>((groups, city) => {
    const region = REGION_BY_STATE[city.state] || 'Other reviewed locations';
    (groups[region] ||= []).push(city);
    return groups;
  }, {});
}
