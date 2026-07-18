import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { SEO } from '../components/SEO';
import { SITE_NAME, SITE_URL, buildSiteUrl, getPrimaryCtaUrl } from '../config/site';
import { publishedCitySlugs } from '../data/publishedCities';
import { trackEvent } from '../utils/analytics';
import { toCanonicalSlug } from '../utils/slugs';
import {
  getPublishedStandardizedAppraiser,
  type StandardizedAppraiser,
} from '../utils/standardizedData';

function nonEmpty<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function StandardizedAppraiserPage() {
  const { appraiserId = '' } = useParams<{ appraiserId: string }>();
  const [appraiser, setAppraiser] = useState<StandardizedAppraiser | null>(null);
  const [loading, setLoading] = useState(true);
  const primaryCtaUrl = getPrimaryCtaUrl();

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublishedStandardizedAppraiser(appraiserId)
      .then((result) => {
        if (active) setAppraiser(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appraiserId]);

  useEffect(() => {
    if (!appraiser) return;
    trackEvent('view_item', {
      appraiser_slug: appraiser.slug,
      appraiser_name: appraiser.name,
      city: appraiser.address.city,
      state: appraiser.address.state,
      specialties: appraiser.expertise.specialties,
    });
  }, [appraiser]);

  const schemas = useMemo(() => {
    if (!appraiser) return [];
    const canonicalId = appraiser.slug;
    const citySlug = toCanonicalSlug(appraiser.address.city);
    const service: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: appraiser.name,
      description: appraiser.content.about,
      url: buildSiteUrl(`/appraiser/${canonicalId}`),
      address: {
        '@type': 'PostalAddress',
        ...(appraiser.address.street ? { streetAddress: appraiser.address.street } : {}),
        ...(appraiser.address.city ? { addressLocality: appraiser.address.city } : {}),
        ...(appraiser.address.state ? { addressRegion: appraiser.address.state } : {}),
        ...(appraiser.address.zip ? { postalCode: appraiser.address.zip } : {}),
        addressCountry: 'US',
      },
      ...(appraiser.imageUrl ? { image: appraiser.imageUrl } : {}),
      ...(appraiser.contact.phone ? { telephone: appraiser.contact.phone } : {}),
      ...(appraiser.contact.email ? { email: appraiser.contact.email } : {}),
      ...(appraiser.contact.website ? { sameAs: [appraiser.contact.website] } : {}),
      ...(appraiser.business.pricing ? { priceRange: appraiser.business.pricing } : {}),
      ...(appraiser.business.hours.length
        ? { openingHours: appraiser.business.hours.map((entry) => `${entry.day} ${entry.hours}`) }
        : {}),
    };
    const breadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${appraiser.address.city} art appraisers`,
          item: buildSiteUrl(`/location/${citySlug}`),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: appraiser.name,
          item: buildSiteUrl(`/appraiser/${canonicalId}`),
        },
      ],
    };
    const faqEntities: Record<string, unknown>[] = [];
    if (appraiser.expertise.services.length) {
      faqEntities.push({
        '@type': 'Question',
        name: `What services does ${appraiser.name} list?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: appraiser.expertise.services.join(', '),
        },
      });
    }
    if (appraiser.expertise.specialties.length) {
      faqEntities.push({
        '@type': 'Question',
        name: `What specialties does ${appraiser.name} list?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: appraiser.expertise.specialties.join(', '),
        },
      });
    }
    const contactMethods = [
      appraiser.contact.phone ? `phone at ${appraiser.contact.phone}` : '',
      appraiser.contact.email ? `email at ${appraiser.contact.email}` : '',
      appraiser.contact.website ? 'the listed website' : '',
    ].filter(Boolean);
    if (contactMethods.length) {
      faqEntities.push({
        '@type': 'Question',
        name: `How can I contact ${appraiser.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use ${contactMethods.join(' or ')}.`,
        },
      });
    }
    return faqEntities.length
      ? [service, breadcrumbs, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqEntities }]
      : [service, breadcrumbs];
  }, [appraiser]);

  if (loading) {
    return (
      <main className="container mx-auto px-6 py-16">
        <p className="text-sm text-muted-foreground">Loading reviewed listing…</p>
      </main>
    );
  }

  if (!appraiser) {
    return (
      <main className="container mx-auto px-6 py-20">
        <SEO
          title={`Listing unavailable | ${SITE_NAME}`}
          description="This provider is not part of the directory's current reviewed public cohort."
          canonicalUrl={buildSiteUrl('/appraiser/')}
          noIndex
          noFollow
        />
        <section className="mx-auto max-w-2xl border border-border bg-white p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Listing unavailable</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">This profile is not currently published.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            The listing may be under review, corrected, or removed. It does not appear in directory search or public feeds.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a className="border border-border px-5 py-3 text-sm font-semibold hover:border-primary" href="/location/">
              Browse reviewed locations
            </a>
            <a className="bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90" href="/get-listed/">
              Correct or suggest a listing
            </a>
          </div>
        </section>
      </main>
    );
  }

  const citySlug = toCanonicalSlug(appraiser.address.city);
  const hasCityRoute = publishedCitySlugs.has(citySlug);
  const specialties = nonEmpty(appraiser.expertise.specialties);
  const services = nonEmpty(appraiser.expertise.services);
  const contactItems = [
    appraiser.address.formatted
      ? {
          key: 'address',
          icon: MapPin,
          label: appraiser.address.formatted,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appraiser.address.formatted)}`,
        }
      : null,
    appraiser.contact.phone
      ? { key: 'phone', icon: Phone, label: appraiser.contact.phone, href: `tel:${appraiser.contact.phone}` }
      : null,
    appraiser.contact.email
      ? { key: 'email', icon: Mail, label: appraiser.contact.email, href: `mailto:${appraiser.contact.email}` }
      : null,
    appraiser.contact.website
      ? { key: 'website', icon: Globe, label: 'Visit listed website', href: appraiser.contact.website }
      : null,
  ].filter(Boolean) as Array<{
    key: 'address' | 'phone' | 'email' | 'website';
    icon: typeof MapPin;
    label: string;
    href: string;
  }>;

  return (
    <main className="bg-[#fbfaf7]">
      <SEO
        title={`${appraiser.name} — Art Appraiser in ${appraiser.address.city} | ${SITE_NAME}`}
        description={`${appraiser.name} is a reviewed public directory listing in ${appraiser.address.city}. Browse listed specialties, services, and contact information.`}
        schema={schemas}
        path={`/appraiser/${appraiser.slug}`}
      />

      <div className="container mx-auto px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><a className="hover:text-primary" href="/">Home</a></li>
            {hasCityRoute ? (
              <>
                <li><ChevronRight className="h-4 w-4" /></li>
                <li><a className="hover:text-primary" href={`/location/${citySlug}`}>{appraiser.address.city}</a></li>
              </>
            ) : null}
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground">{appraiser.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="border border-border bg-white p-7 md:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <InitialsAvatar imageUrl={appraiser.imageUrl} name={appraiser.name} size="lg" className="shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reviewed public listing</p>
                <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                  {appraiser.name}
                </h1>
                {appraiser.address.city ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {appraiser.address.city}, {appraiser.address.state}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-8">
              <h2 className="font-serif text-2xl font-semibold">About this listing</h2>
              <p className="mt-4 leading-7 text-muted-foreground">{appraiser.content.about}</p>
              <p className="mt-4 border-l-2 border-accent pl-4 text-sm leading-6 text-muted-foreground">
                Ratings and reviews are not currently published. Directory review confirms the public listing record, not a credential or service-quality guarantee.
              </p>
            </div>

            {specialties.length ? (
              <section className="mt-8">
                <h2 className="font-serif text-2xl font-semibold">Listed specialties</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <li key={specialty} className="border border-border bg-[#fbfaf7] px-3 py-2 text-sm">{specialty}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {services.length ? (
              <section className="mt-8">
                <h2 className="font-serif text-2xl font-semibold">Listed services</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {services.map((service) => (
                    <li key={service} className="border-l-2 border-primary bg-[#fbfaf7] px-4 py-3 text-sm">{service}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {appraiser.business.hours.length ? (
              <section className="mt-8">
                <h2 className="font-serif text-2xl font-semibold">Business hours</h2>
                <dl className="mt-4 divide-y divide-border border-y border-border">
                  {appraiser.business.hours.map((entry) => (
                    <div key={`${entry.day}-${entry.hours}`} className="flex justify-between gap-4 py-3 text-sm">
                      <dt>{entry.day}</dt><dd className="font-medium">{entry.hours}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {appraiser.expertise.certifications.length ? (
              <section className="mt-8">
                <h2 className="font-serif text-2xl font-semibold">Listed certifications</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {appraiser.expertise.certifications.map((certification) => (
                    <li key={certification}>{certification}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>

          <aside className="space-y-6">
            {contactItems.length ? (
              <section className="border border-border bg-white p-6">
                <h2 className="font-serif text-xl font-semibold">Contact information</h2>
                <ul className="mt-4 space-y-2">
                  {contactItems.map(({ key, icon: Icon, label, href }) => (
                    <li key={key}>
                      <a
                        className="flex min-h-[44px] items-center gap-3 text-sm text-foreground hover:text-primary"
                        href={href}
                        target={key === 'address' || key === 'website' ? '_blank' : undefined}
                        rel={key === 'address' || key === 'website' ? 'noopener noreferrer' : undefined}
                        onClick={() =>
                          trackEvent('appraiser_contact_click', {
                            channel: key,
                            placement: 'profile_contact_info',
                            appraiser_slug: appraiser.slug,
                            appraiser_name: appraiser.name,
                          })
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="break-all">{label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="bg-foreground p-6 text-white">
              <h2 className="font-serif text-xl font-semibold">Need a written online appraisal?</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">Submit photos and item details to Appraisily.</p>
              <a
                className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center bg-white px-4 py-3 text-sm font-semibold text-foreground hover:bg-[#f4efe6]"
                href={primaryCtaUrl}
                onClick={() =>
                  trackEvent('cta_click', {
                    placement: 'profile_sidebar_cta',
                    destination: primaryCtaUrl,
                    appraiser_slug: appraiser.slug,
                  })
                }
              >
                Start an appraisal
              </a>
            </section>

            <a className="block text-sm underline underline-offset-4 hover:text-primary" href="/get-listed/">
              Correct or suggest an update to this listing
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}
