import publishedAppraiserFeed from '../../public_site/appraisers.json';

export const publishedAppraiserSlugs = new Set(
  publishedAppraiserFeed.appraisers
    .map((appraiser) => appraiser.slug)
    .filter(Boolean)
);

export const publishedAppraisers = [...publishedAppraiserFeed.appraisers].sort(
  (left, right) => left.name.localeCompare(right.name)
);

export function isPublishedAppraiserSlug(slug: string | undefined): boolean {
  return Boolean(slug && publishedAppraiserSlugs.has(slug));
}
