import { ArrowRight, MapPin } from 'lucide-react';
import { SEO } from '../components/SEO';
import { SITE_NAME, getPrimaryCtaUrl } from '../config/site';
import { publishedAppraisers } from '../data/publishedAppraisers';

export function LocationHubPage() {
  const primaryCtaUrl = getPrimaryCtaUrl({
    utm_source: 'art_directory',
    utm_medium: 'location_hub',
    utm_campaign: 'online_appraisal',
  });

  return (
    <main className="bg-[#fbfaf7]">
      <SEO
        title={`Reviewed Art Appraiser Locations | ${SITE_NAME}`}
        description="Browse five source-reviewed art appraiser profiles by verified primary location."
        path="/location/"
      />
      <div className="container mx-auto px-6 py-14">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reviewed profiles</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">Art appraisers by verified primary location</h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            This directory publishes a provider only after an official source confirms identity,
            primary location, and fine-art appraisal relevance. Location is not presented as a
            promise of service throughout a city or region.
          </p>
        </header>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {publishedAppraisers.map((appraiser) => (
            <article key={appraiser.slug} className="border border-border bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                {appraiser.address.city}, {appraiser.address.region}
              </div>
              <h2 className="mt-3 font-serif text-xl font-semibold">{appraiser.name}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{appraiser.description}</p>
              <a
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 font-semibold text-primary"
                href={`/appraiser/${appraiser.slug}/`}
              >
                Review provider details <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
        <section className="mx-auto mt-12 max-w-3xl border-t border-border pt-8 text-center">
          <h2 className="font-serif text-2xl font-semibold">Local or online?</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            A nearby provider may be useful when an in-person inspection is required. An online
            appraisal can be an alternative when photographs and documentation are sufficient for
            the intended use.
          </p>
          <a
            href={primaryCtaUrl}
            className="mt-6 inline-flex min-h-[48px] items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Start an online appraisal <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </div>
    </main>
  );
}
