import { ArrowRight, BookOpenCheck, MapPin, ShieldCheck } from 'lucide-react';
import { SEO } from './components/SEO';
import {
  DECISION_ROUTER_ICON_SET,
  DECISION_ROUTER_VARIANT,
  DecisionRouter,
} from './components/DecisionRouter';
import { publishedAppraisers } from './data/publishedAppraisers';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, getPrimaryCtaUrl } from './config/site';
import { trackEvent } from './utils/analytics';

function App() {
  const primaryCtaUrl = getPrimaryCtaUrl();
  const decisionCampaign = 'art-directory';
  const signedReportUrl = getPrimaryCtaUrl({
    utm_source: 'directory',
    utm_medium: 'decision_router',
    utm_campaign: decisionCampaign,
    utm_content: 'signed_report',
    service: 'regular',
  });
  const screenerUrl = `https://appraisily.com/screener?utm_source=directory&utm_medium=decision_router&utm_campaign=${decisionCampaign}&utm_content=screener`;
  const professionalSampleUrl = `https://appraisily.com/sample-reports/professional?utm_source=directory&utm_medium=decision_router&utm_campaign=${decisionCampaign}&utm_content=sample_professional`;
  const instantSampleUrl = `https://appraisily.com/sample-reports/instant?utm_source=directory&utm_medium=decision_router&utm_campaign=${decisionCampaign}&utm_content=sample_instant`;

  const homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
  };

  return (
    <>
      <SEO
        title={`${SITE_NAME} | Reviewed Art Appraiser Listings`}
        description={SITE_DESCRIPTION}
        keywords={[
          'art appraiser near me',
          'art appraiser directory',
          'fine art appraisal',
          'art valuation services',
          'art appraisal for insurance',
          'art appraisal for estate',
        ]}
        schema={homeSchema}
        canonicalUrl={SITE_URL}
      />

      <main className="flex-1 bg-background">
        <section className="relative overflow-hidden border-b border-border bg-[#f4efe6] py-20 md:py-28">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] border-l border-[#d8ccbb] bg-[linear-gradient(135deg,rgba(91,31,42,.10),transparent_55%)] lg:block" />
          <div className="container relative mx-auto px-6">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              An independent directory by Appraisily
            </p>
            <h1 className="mx-auto max-w-4xl text-center font-serif text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
              Find an art appraiser with clearer information.
            </h1>
            <p className="mx-auto mb-9 mt-6 max-w-2xl text-center text-base leading-7 text-muted-foreground md:text-lg">
              Browse a small, reviewed set of public listings by location, specialty, and service.
              Ratings are not currently published.
            </p>

            <div className="relative z-10 mx-auto flex max-w-2xl flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/appraiser/"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
              >
                Browse reviewed appraisers <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/location/"
                className="inline-flex min-h-[48px] items-center justify-center border border-[#cbbdac] bg-white px-7 py-3 text-sm font-semibold text-foreground"
              >
                Compare verified locations
              </a>
            </div>

            <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-[#554b43]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {publishedAppraisers.length} source-reviewed profiles
              </span>
              <a className="underline decoration-[#b7a797] underline-offset-4 hover:text-primary" href="/methodology/">
                How listings are reviewed
              </a>
              <a className="underline decoration-[#b7a797] underline-offset-4 hover:text-primary" href="/get-listed/">
                Correct or suggest a listing
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="container mx-auto px-6">
            <DecisionRouter
              signedReportUrl={signedReportUrl}
              screenerUrl={screenerUrl}
              localHref="/location/"
              localLabel="Browse local listings"
              professionalSampleUrl={professionalSampleUrl}
              instantSampleUrl={instantSampleUrl}
              campaign={decisionCampaign}
              onCtaClick={(ctaKind, placement, destination) =>
                trackEvent('directory_cta', {
                  placement,
                  cta_kind: ctaKind,
                  destination,
                  campaign: decisionCampaign,
                  router_variant: DECISION_ROUTER_VARIANT,
                  icon_set: DECISION_ROUTER_ICON_SET,
                })
              }
              onRouterView={(placement, visibleRatio) =>
                trackEvent('decision_router_view', {
                  placement,
                  campaign: decisionCampaign,
                  router_variant: DECISION_ROUTER_VARIANT,
                  icon_set: DECISION_ROUTER_ICON_SET,
                  visible_ratio: Number(visibleRatio.toFixed(3)),
                  cta_count: 4,
                })
              }
            />
          </div>
        </section>

        <section className="border-y border-border bg-[#fbfaf7] py-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Directory standards</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground md:text-4xl">
                Useful facts, without invented signals
              </h2>
            </div>
            <div className="mx-auto grid max-w-5xl gap-px border border-border bg-border md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Reviewed public records',
                  body: 'Only the current reviewed cohort appears in search, navigation, and public feeds.',
                },
                {
                  icon: BookOpenCheck,
                  title: 'Plain-language methodology',
                  body: 'Our methodology explains what review means, what it does not mean, and how to request a correction.',
                },
                {
                  icon: MapPin,
                  title: 'Location without doorway pages',
                  body: 'Primary locations come from reviewed provider sources; generic one-provider city shells are not published.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="bg-white p-7">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16" id="locations">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reviewed providers</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground md:text-4xl">
                Five providers with source-backed details
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Each profile identifies its verified primary location, specialties, appraisal
                purposes, qualifications, and source path.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              {publishedAppraisers.map((appraiser) => (
                <article key={appraiser.slug} className="border border-border bg-[#fbfaf7] p-6">
                  <p className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MapPin className="h-4 w-4" />
                    {appraiser.address.city}, {appraiser.address.region}
                  </p>
                  <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
                    {appraiser.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {appraiser.description}
                  </p>
                  <a
                    href={`/appraiser/${appraiser.slug}/`}
                    className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-primary"
                  >
                    Review provider details <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                No reviewed listing near you? An online appraisal may still help.
              </p>
              <a
                href={primaryCtaUrl}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
                data-gtm-event="cta_click"
                data-gtm-placement="home_directory"
                onClick={() =>
                  trackEvent('cta_click', {
                    placement: 'home_directory',
                    destination: primaryCtaUrl,
                  })
                }
              >
                Start an online appraisal <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
