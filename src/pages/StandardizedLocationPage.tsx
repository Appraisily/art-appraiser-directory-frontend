import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, MapPin } from 'lucide-react';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { SEO } from '../components/SEO';
import { SITE_NAME, SITE_URL, buildSiteUrl, getPrimaryCtaUrl } from '../config/site';
import { publishedCities } from '../data/publishedCities';
import { trackEvent } from '../utils/analytics';
import {
  getPublishedStandardizedLocation,
  type StandardizedAppraiser,
  type StandardizedLocation,
} from '../utils/standardizedData';

export function StandardizedLocationPage() {
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  const city = publishedCities.find((entry) => entry.slug === citySlug);
  const [location, setLocation] = useState<StandardizedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const primaryCtaUrl = getPrimaryCtaUrl();

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublishedStandardizedLocation(citySlug)
      .then((result) => {
        if (active) setLocation(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [citySlug]);

  const schemas = useMemo(() => {
    if (!city || !location) return [];
    const cityUrl = buildSiteUrl(`/location/${city.slug}`);
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Art appraisers in ${city.name}, ${city.state}`,
        url: cityUrl,
        description: `Reviewed public art appraiser listings in ${city.name}, ${city.state}.`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: location.appraisers.length,
          itemListElement: location.appraisers.map((appraiser, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: appraiser.name,
            url: buildSiteUrl(`/appraiser/${appraiser.slug}`),
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Locations', item: buildSiteUrl('/location/') },
          { '@type': 'ListItem', position: 3, name: city.name, item: cityUrl },
        ],
      },
    ];
  }, [city, location]);

  if (loading) {
    return <main className="container mx-auto px-6 py-16 text-sm text-muted-foreground">Loading reviewed listings…</main>;
  }

  if (!city) {
    return (
      <main className="container mx-auto px-6 py-20">
        <SEO
          title={`Location unavailable | ${SITE_NAME}`}
          description="This location is not part of the directory's current reviewed public cohort."
          path={`/location/${citySlug}`}
          noIndex
          noFollow
        />
        <section className="mx-auto max-w-2xl border border-border bg-white p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Location unavailable</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">No reviewed city page is published here.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Suppressed listings are not restored after the page loads. Browse one of the currently reviewed locations instead.
          </p>
          <a className="mt-7 inline-flex bg-primary px-5 py-3 text-sm font-semibold text-white" href="/location/">
            Browse reviewed locations
          </a>
        </section>
      </main>
    );
  }

  const appraisers = location?.appraisers || [];
  const title = `Art Appraisers in ${city.name}, ${city.state} | ${SITE_NAME}`;
  const description = `Browse ${appraisers.length} reviewed public art appraiser ${appraisers.length === 1 ? 'listing' : 'listings'} in ${city.name}, ${city.state}. Ratings are not currently published.`;

  const handleCardClick = (appraiser: StandardizedAppraiser) => {
    trackEvent('appraiser_card_click', {
      placement: 'location_directory',
      city_slug: city.slug,
      appraiser_slug: appraiser.slug,
      appraiser_name: appraiser.name,
    });
  };

  return (
    <main className="bg-[#fbfaf7]">
      <SEO title={title} description={description} schema={schemas} path={`/location/${city.slug}`} />
      <div className="container mx-auto px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><a className="hover:text-primary" href="/">Home</a></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li><a className="hover:text-primary" href="/location/">Locations</a></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground">{city.name}</li>
          </ol>
        </nav>

        <header className="border border-border bg-[#f4efe6] px-7 py-10 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reviewed location</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Art appraisers in {city.name}, {city.state}
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
            {appraisers.length
              ? `${appraisers.length} reviewed public ${appraisers.length === 1 ? 'listing is' : 'listings are'} currently available. Compare listed specialties and contact details.`
              : 'No reviewed public listings are currently available in this location.'}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Ratings and review counts are not currently published.{' '}
            <a className="underline underline-offset-4 hover:text-primary" href="/methodology/">Read the directory methodology.</a>
          </p>
        </header>

        {appraisers.length ? (
          <section className="mt-10">
            <h2 className="font-serif text-2xl font-semibold">Reviewed listings</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {appraisers.map((appraiser) => (
                <a
                  key={appraiser.slug}
                  href={`/appraiser/${appraiser.slug}`}
                  onClick={() => handleCardClick(appraiser)}
                  className="group border border-border bg-white p-6 transition-colors hover:border-primary"
                >
                  <div className="flex gap-5">
                    <InitialsAvatar imageUrl={appraiser.imageUrl} name={appraiser.name} size="md" className="shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary">
                        {appraiser.name}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {appraiser.address.city}, {appraiser.address.state}
                      </p>
                      {appraiser.expertise.specialties.length ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {appraiser.expertise.specialties.slice(0, 3).join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    View listing <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-10 border border-border bg-white p-8 text-center">
            <h2 className="font-serif text-2xl font-semibold">No reviewed listings available</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              We do not display providers while their records are outside the reviewed publication cohort.
            </p>
          </section>
        )}

        <section className="mt-12 bg-foreground p-7 text-white md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Need a written online appraisal?</h2>
            <p className="mt-2 text-sm text-white/75">Submit photos and item details to Appraisily.</p>
          </div>
          <a
            className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-foreground md:mt-0"
            href={primaryCtaUrl}
            onClick={() =>
              trackEvent('cta_click', {
                placement: 'location_bottom',
                destination: primaryCtaUrl,
                city_slug: city.slug,
              })
            }
          >
            Start an appraisal <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </div>
    </main>
  );
}
