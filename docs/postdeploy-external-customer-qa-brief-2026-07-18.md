# Post-Deploy External Customer QA Brief

**Prepared:** 2026-07-18
**Use:** issue a fresh authenticated external-QA prompt only after the reviewed
release is live.
**Status:** coverage brief, not a tester-executable prompt. It intentionally
contains no QA ticket because tickets expire after 24 hours.

## Comparison Baseline

- Failed production receipt:
  `qa_2b735425-23ea-4424-9149-df2a5b477445`
- Failed run:
  `f7a0c00d-204e-427e-a32b-5a3d2cfe56a3`
- Durable baseline:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-18/f7a0c00d-204e-427e-a32b-5a3d2cfe56a3/`
- Candidate artifact commit: `9278b5335e61`
- Expected candidate inventory: 5 reviewed providers, 5 reviewed cities,
  5 location-menu entries, and 13 sitemap URLs.

## Prompt Mode and Customer Story

Use `blind_customer` with a short acceptance appendix. The tester is handling
an inherited painting in Boston and wants to decide whether to contact a local
specialist or buy Appraisily's written online appraisal. The tester should
explore naturally before reading the explicit checks.

Start at:
`https://art-appraisers-directory.appraisily.com/`

Use:

- desktop at 1440×900;
- mobile at 390×844;
- anonymous browsing;
- no payment, account creation, email, public correction submission, or final
  feedback submission;
- synthetic text only and no customer PII.

Use a genuinely isolated browser profile when the tester can prove it. If
isolation cannot be proven, label clean/returning identity coverage
`not_proven`; do not reinterpret the limitation as a product failure.

## Natural Journey

Before exposing the acceptance checks, ask the tester to record:

1. First impression and what the directory appears to promise.
2. Which local, online, or screener path they choose and why.
3. Whether provider inventory, methodology, ratings policy, and correction
   ownership feel credible enough to contact or purchase.
4. Whether they would continue for the inherited painting.

The natural journey should include the homepage, location browsing or search,
Boston, the reviewed Boston provider, methodology, correction guidance, and
the online-appraisal handoff. Do not direct the tester to hidden URLs until
after this narrative is recorded.

## Acceptance Appendix

### Publication and routing

- The Locations menu offers exactly Boston, Houston, Los Angeles, New York,
  and Philadelphia; each route resolves intentionally and no city is
  duplicated.
- Homepage location groups contain those same five cities exactly once.
- The location hub exposes the five reviewed provider profiles by verified
  primary location without linking to separate one-provider city pages.
- Direct requests for the retired Boston, Houston, Los Angeles, New York, and
  Philadelphia city shells return HTTP `410`.
- `/location/atlanta/` returns HTTP 404 and exposes no provider identities,
  cards, counts, ratings, reviews, contacts, or provider schema.
- `/location/atlanta/index.html` returns 404.
- `/appraiser/alicia-e-weaver/` must return a branded HTTP `404` unavailable
  page with no canonical. Initial HTML and hydrated DOM must contain no Alicia
  identity, address, rating, review, contact data, or `ProfessionalService`
  schema.
- `/appraiser/alicia-e-weaver/index.html` returns 404.

### Trust and provider presentation

- Homepage, Boston, and its provider publish no numeric rating or review count
  and make no unsupported universal certification claim.
- Methodology explains sourcing, the meaning and limits of “reviewed,”
  credentials, locations, ratings, and corrections.
- Correction guidance leads to an intentional Appraisily contact handoff, not
  a directory 404.
- The Boston card uses an intentional initials fallback with no broken image or
  favicon.
- The reviewed profile retains global navigation, Start Appraisal CTA,
  breadcrumb, feedback section, and footer.
- Profile UI and structured data omit zero ratings, empty business
  hours/certifications, and malformed blank contact sentences.

### Keyboard, responsive behavior, and feedback

- On mobile, Escape closes the open navigation panel and returns focus to its
  trigger.
- Tab and Shift+Tab expose visible focus and do not trap the user in the menu.
- No page-level horizontal overflow appears at 390×844 or at 200% browser zoom.
- Feedback begins with its textarea and send control disabled.
- Keyboard Enter on “No” selects the vote and makes the optional comment flow
  reachable. Do not submit the synthetic feedback.
- No sticky or fixed element obscures navigation, provider content, feedback,
  or the primary CTA.

### Assets, network, and downstream handoff

- All visible first-party images, icons, CSS, JavaScript, favicon assets, and
  the three decision-router illustrations load without a failed request.
- Record every failed first-party request as method, path/URL, status or
  network error, and immediately preceding action.
- Record first-party console errors separately from browser extensions and
  test-tool messages.
- The online handoff still presents a signed single-item appraisal for $59
  with scope visible before purchase. Do not pay or create an order.
- Specifically record whether React errors 418, 423, or 425 recur on the
  handoff; treat them as the owning main-page finding rather than silently
  attributing them to the directory.

## Evidence and Decision Rules

Request viewport/section screenshots for:

- desktop homepage;
- mobile menu with visible keyboard focus;
- Toledo or Atlantis zero-result state;
- Boston city and provider fallback/shell;
- generic suppressed-provider response;
- methodology;
- online handoff with price and scope.

Require exact HTTP evidence, console output, and failed first-party request
records where the tester supports them. Missing screenshots, profile
isolation, network diagnostics, geolocation, or exact zoom evidence must be
listed under both tool limitations and not proven.

Use `no_go` only for an evidenced blocking Appraisily defect such as private
data exposure, unsafe payment/order behavior, data loss, or an inaccessible
primary task without safe recovery. A serious trust, routing, keyboard, or
inventory regression should produce `FAIL` with `go_with_known_risk` unless it
also meets that blocking threshold.

The tester must name what should be preserved, compare every finding with the
baseline receipt, submit one canonical `result.json` through the newly issued
ticket, and return only the successful receipt ID.

## Issuance Gate

After production promotion and the internal live canary:

1. Re-read the current customer-QA prompt-generator skill.
2. Generate the final self-contained prompt from this brief and the deployed
   release evidence.
3. Issue exactly one fresh 24-hour version-2 ticket.
4. Verify prompt hash, run ID, endpoint, token length/prefix, and expiration.
5. Hand the prompt to the external tester immediately; never pre-issue or reuse
   the failed run's ticket.
