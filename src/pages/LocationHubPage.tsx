import { MapPin } from 'lucide-react';
import { SEO } from '../components/SEO';
import { SITE_NAME } from '../config/site';
import { groupPublishedCitiesByRegion } from '../data/publishedCities';

export function LocationHubPage() {
  const regions = groupPublishedCitiesByRegion();

  return (
    <main className="bg-[#fbfaf7]">
      <SEO
        title={`Reviewed Art Appraiser Locations | ${SITE_NAME}`}
        description="Browse every city with a reviewed public art appraiser listing."
        path="/location/"
      />
      <div className="container mx-auto px-6 py-14">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Locations</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">Reviewed art appraiser locations</h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            Every city shown here has at least one listing in the current reviewed publication cohort.
          </p>
        </header>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(regions).map(([region, cities]) => (
            <section key={region} className="border border-border bg-white p-6">
              <h2 className="border-b border-border pb-3 font-serif text-xl font-semibold">{region}</h2>
              <ul className="mt-3 space-y-1">
                {cities.map((city) => (
                  <li key={city.slug}>
                    <a
                      className="flex min-h-[44px] items-center gap-2 text-sm hover:text-primary"
                      href={`/location/${city.slug}`}
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      {city.name}, {city.state}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
