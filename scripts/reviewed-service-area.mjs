// A reviewed service area is not an office address. Keep primary locality intact.
export function hasReviewedCityCoverage(profile, reviewed, citySlug) {
  return Boolean(
    reviewed?.claimScope?.includes('service_area')
    && reviewed.serviceArea
    && reviewed.serviceAreaCitySlugs?.includes(citySlug)
    && reviewed.sourceUrl === profile?.website
    && reviewed.reviewedAt === profile?.source?.verifiedAt
    && reviewed.city === profile?.address?.city
  );
}
