# Proposal: add-apify-shopee-actors

## Why

The apify connector covers Amazon, Google Shopping and TikTok commerce but has
no Shopee coverage, and Shopee is the largest marketplace in Southeast Asia
and a major one in Brazil. Issue #140 asks for it and names four Apify Store
actors. This change ports three of them: product search, the full product
record, and review history. Each is `PAY_PER_EVENT` with a published card, so
each is pure endpoint data under the existing provider lifecycle.

## What Changes

- **Three endpoints under `connectors/apify/endpoints/shopee/`**, ids the
  actors' own Store slugs:
  - `apify#gio21/shopee-scraper` — listings by keyword, shop URL or category
    URL in eight markets. Card: `apify-actor-start` $0.00005 and
    `apify-default-dataset-item` $0.005, one price on every plan.
  - `apify#zen-studio/shopee-product-detail-scraper` — the full product
    record by product URL. Card: `apify-actor-start` $0.008, `result`
    $0.00699, `apify-default-dataset-item` $0.00001.
  - `apify#zen-studio/shopee-product-reviews-scraper` — reviews by product
    URL. Card: `apify-actor-start` $0.008, `reviews` $0.00299,
    `apify-default-dataset-item` $0.00001.

  Amounts are the Business-tier (GOLD) rates of the pricingInfo in effect on
  2026-11-24, read from the public `/v2/acts/{id}` endpoint.
- **Scaffolded mirrors.** `schema/inputs.ts` and `schema/output.ts` are the
  scaffold's output (fetched token-free from the public build endpoint),
  curated in three places: the `stringList` fields the scaffold emits as
  `z.any()` items are typed as strings; HTML entities in two descriptions
  are decoded; and the two zen-studio actors' hidden `feedback` field is left
  out of the mirror (it is a free-text note relayed to the actor's
  maintainers, not a scraping parameter). Both zen-studio actors publish an
  empty dataset field map, so their output schemas document nothing yet.
- **Estimates are deduced from the binding (D25).** `maxItems` (search) and
  `maxReviewsPerProduct` (reviews) are required; the reviews actor documents
  0 as the full history, so the cap is floored at 1. The detail endpoint
  estimates one product per URL.
- **The detail actor's reviews add-on is rejected at the binding.** With
  `includeReviews` the actor writes reviews to a separate named `reviews`
  dataset and bills each one, while the provider lifecycle returns the
  default dataset only: the caller would pay for rows it never receives.
  `includeReviews` is pinned to `false`, the `reviews` line is not modeled,
  and the event is listed in the drift suite's `EXCLUDED` map with that
  reason. The reviews endpoint is the supported route.
- **Two docs carry their own `usage.evidence`**, each reading a positive
  marker the actor documents, so unbilled rows do not bill the main line
  while the per-row platform line counts every row:
  - detail: a product is a row whose `listingStatus` is `available` (the
    actor's README: "Rows that are not `available` are never charged");
  - reviews: a review is a row carrying `reviewId` (`_warning` rows and the
    maintenance notice row are documented as unbilled).
- **One category leaf**: `shopee`.
- `test-inputs.json` rows, `CHAIN_COUNTS` rows for the two multi-metered
  docs, estimate spot checks, binding-gate checks, and two settle tests over
  realistic row mixes.

## Capabilities

- `apify-connector`.

## Non-goals

- **`xtracto/shopee-scraper` is held back**, for two reasons that need a
  maintainer decision rather than a guess:
  1. Its pricingInfo sets `isPPEPlatformUsagePaidByUser: true`, so the run's
     compute is billed on top of the published events. No actor in the
     connector today has that flag, and the connector settles on the declared
     card alone, so the card would understate every run.
  2. Its `apify-actor-start` event is $0.05 per GB and the actor's default
     memory is 4096 MB, so a default run pays $0.20 at start against a pinned
     $0.05 (the drift suite pins the published rate for this event name).

  It also shares its actor name with `gio21/shopee-scraper`; the scaffold and
  `drift --fix` locate an endpoint folder by actor name, so a second folder
  would need a name the tooling does not derive.
- No `usage.consolidate`: the apify provider deliberately settles on the
  declared card (owner decision 2026-09-17).
- No live tests and no new fixtures: the provider's shared chains serve the
  new docs. None of the three has been run against a paid Apify account in
  this change; the evidence markers come from the actors' published READMEs.

## Impact

One new endpoint tree, one category leaf, one `EXCLUDED` entry in the drift
suite. No engine, `shared/`, `config.yml` or `ENGINE_VERSION` change.
