import { SEO } from '../components/SEO';
import { SITE_NAME } from '../config/site';

const sections = [
  {
    title: 'How listings are sourced',
    body: 'We start with public business records and provider-published information. A listing is not bought, and payment does not determine whether it appears in this directory.',
  },
  {
    title: 'What “reviewed” means',
    body: 'Reviewed means the current public record has been checked for a usable name, location, public route, and basic contact or service information before publication. It does not certify credentials, guarantee service quality, or endorse the provider.',
  },
  {
    title: 'Credentials and locations',
    body: 'Credentials are shown only when they are present in the reviewed record. Users should confirm current qualifications, geographic coverage, fees, and report suitability directly with the provider.',
  },
  {
    title: 'Ratings and reviews',
    body: 'Numeric ratings and review counts are not currently published. We will not restore them unless a documented provenance, verification, moderation, and freshness policy is approved.',
  },
  {
    title: 'Corrections',
    body: 'Providers and users can suggest a correction. Submissions are reviewed before publication; they do not update a listing automatically.',
  },
];

export function MethodologyPage() {
  return (
    <main className="bg-[#fbfaf7]">
      <SEO
        title={`Directory Methodology | ${SITE_NAME}`}
        description="Learn how Art Appraisers Directory sources, reviews, publishes, and corrects provider listings."
        path="/methodology/"
        noIndex
      />
      <article className="container mx-auto max-w-4xl px-6 py-14">
        <header className="border-b border-border pb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Trust and methodology</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">What a reviewed listing means</h1>
          <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
            This directory is designed to make public provider information easier to compare without turning incomplete data into a stronger claim.
          </p>
        </header>
        <div className="divide-y divide-border">
          {sections.map((section) => (
            <section key={section.title} className="py-8">
              <h2 className="font-serif text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <aside className="border border-border bg-white p-6">
          <h2 className="font-serif text-xl font-semibold">See something inaccurate?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Tell us what changed and include a public source when possible.</p>
          <a className="mt-4 inline-flex bg-primary px-5 py-3 text-sm font-semibold text-white" href="/get-listed/">
            Correct or suggest a listing
          </a>
        </aside>
      </article>
    </main>
  );
}
