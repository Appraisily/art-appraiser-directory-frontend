import { SEO } from '../components/SEO';
import { PARENT_SITE_URL, SITE_NAME } from '../config/site';

export function GetListedPage() {
  const contactUrl = `${PARENT_SITE_URL}/contact?source=art_directory_listing`;

  return (
    <main className="bg-[#fbfaf7]">
      <SEO
        title={`Correct or Suggest a Listing | ${SITE_NAME}`}
        description="Request a correction to an existing art appraiser listing or suggest a public provider record for review."
        path="/get-listed/"
        noIndex
      />
      <div className="container mx-auto max-w-4xl px-6 py-14">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Listing requests</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">Correct or suggest a listing</h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            Tell us whether you are correcting an existing record or suggesting a provider for review. Submission does not guarantee publication.
          </p>
        </header>
        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-2">
          <section className="bg-white p-7">
            <h2 className="font-serif text-2xl font-semibold">Correct a listing</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Include the listing URL, the field that is wrong, the correct information, and a public source where possible.
            </p>
          </section>
          <section className="bg-white p-7">
            <h2 className="font-serif text-2xl font-semibold">Suggest a provider</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Include the provider name, city, public website, specialties, and any public credential source. Paid placement is not offered.
            </p>
          </section>
        </div>
        <section className="mt-8 bg-foreground p-7 text-white">
          <h2 className="font-serif text-2xl font-semibold">Send the request to Appraisily</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Requests are reviewed before any public record changes. Do not send private client or appraisal information.
          </p>
          <a className="mt-5 inline-flex bg-white px-5 py-3 text-sm font-semibold text-foreground" href={contactUrl}>
            Open the contact form
          </a>
        </section>
      </div>
    </main>
  );
}
