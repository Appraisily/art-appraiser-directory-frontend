import { ArrowRight, MapPin } from 'lucide-react';
import { SEO } from '../components/SEO';
import { SITE_NAME, SITE_URL, buildSiteUrl } from '../config/site';
import { publishedAppraisers } from '../data/publishedAppraisers';

export function AppraiserHubPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Reviewed Art Appraiser Listings',
    description: 'Browse art appraiser profiles in the current reviewed publication cohort.',
    url: buildSiteUrl('/appraiser/'),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: publishedAppraisers.length,
      itemListElement: publishedAppraisers.map((appraiser, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: appraiser.name,
        url: buildSiteUrl(`/appraiser/${appraiser.slug}/`),
      })),
    },
  };

  return (
    <main className="bg-[#fbfaf7]">
      <SEO
        title={`Reviewed Art Appraiser Listings | ${SITE_NAME}`}
        description="Browse every profile in the current reviewed art appraiser publication cohort."
        canonicalUrl={`${SITE_URL}/appraiser/`}
        schema={schema}
      />
      <div className="container mx-auto px-6 py-14">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Reviewed public cohort
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">
            Art appraiser listings
          </h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            These profiles currently meet the directory publication standard.
            Ratings and review counts are not currently published.
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-border bg-white p-6">
            <h2 className="font-serif text-2xl font-semibold">What the review covers</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Publication requires an official source supporting provider identity, a primary
              location, and relevance to fine-art appraisal. Each profile identifies its source
              and review date and offers a correction path.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The directory does not independently confirm current availability, fees, service
              area, engagement terms, ratings, or review counts.
            </p>
          </section>
          <section className="rounded-lg border border-border bg-white p-6">
            <h2 className="font-serif text-2xl font-semibold">How to compare profiles</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Start with the provider&apos;s verified primary location, then compare supported
              specialties, appraisal purposes, qualifications, and the linked official source.
              A primary location is not a promise of coverage in every nearby city.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Confirm whether the assignment can be completed remotely or needs an in-person
              inspection before engaging a provider.
            </p>
          </section>
        </div>

        <ul className="mx-auto mt-10 grid max-w-5xl gap-px border border-border bg-border md:grid-cols-2">
          {publishedAppraisers.map((appraiser) => (
            <li key={appraiser.slug} className="bg-white">
              <a
                className="group flex min-h-40 flex-col justify-between p-7 hover:bg-[#f8f4ed]"
                href={`/appraiser/${appraiser.slug}/`}
              >
                <div>
                  <h2 className="font-serif text-2xl font-semibold group-hover:text-primary">
                    {appraiser.name}
                  </h2>
                  {appraiser.address?.city && appraiser.address?.region ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {appraiser.address.city}, {appraiser.address.region}
                    </p>
                  ) : null}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  View reviewed listing <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-5xl text-sm text-muted-foreground">
          Need to correct a record?{' '}
          <a className="font-semibold text-primary underline underline-offset-4" href="/get-listed/">
            Correct or suggest a listing
          </a>
          .
        </p>
      </div>
    </main>
  );
}
