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

// Field checks can happen after the original provider review. This path is only
// for an explicitly reviewed regional option with an omitted, unconfirmed office.
// It must never turn a regional label into a primary locality or inferred city.
export function hasReviewedManifestCityCoverage(profile, publication, citySlug) {
  const evidence = publication?.fieldEvidence?.service_area;
  const omission = publication?.fieldEvidence?.primary_location;
  const ownedSource = field => {
    try {
      const source = new URL(field.sourceUrl);
      const official = new URL(publication.sourceUrl);
      return source.protocol === 'https:'
        && source.hostname.replace(/^www\./, '') === official.hostname.replace(/^www\./, '')
        && /^\d{4}-\d{2}-\d{2}$/.test(field.checkedAt || '')
        && new Date(`${field.checkedAt}T00:00:00Z`).toISOString().slice(0, 10) === field.checkedAt;
    } catch { return false; }
  };
  return Boolean(
    citySlug && publication?.publicationStatus === 'verified'
    && publication.slug === profile?.slug
    && publication.sourceUrl === profile?.website
    && publication.verifiedAt === profile?.source?.verifiedAt
    && publication.claimScope?.includes('fine_art_services')
    && publication.claimScope?.includes('service_area')
    && typeof evidence?.value?.label === 'string' && evidence.value.label.trim()
    && Array.isArray(evidence.value.citySlugs) && evidence.value.citySlugs.includes(citySlug)
    && ownedSource(evidence)
    && omission?.decision === 'omit' && ownedSource(omission)
    && !Object.values(profile.address || {}).some(Boolean)
  );
}
