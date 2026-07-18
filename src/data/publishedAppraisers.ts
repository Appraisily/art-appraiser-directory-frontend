import publishedAppraisers from '../../public_site/appraisers.json';

export const publishedAppraiserSlugs = new Set(
  publishedAppraisers.appraisers
    .map((appraiser) => appraiser.slug)
    .filter(Boolean)
);

export function isPublishedAppraiserSlug(slug: string | undefined): boolean {
  return Boolean(slug && publishedAppraiserSlugs.has(slug));
}
