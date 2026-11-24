# apify-connector (delta)

## ADDED Requirements

### Requirement: Shopee actors are pure endpoint data on the apify provider
Each of `apify#gio21/shopee-scraper`,
`apify#zen-studio/shopee-product-detail-scraper` and
`apify#zen-studio/shopee-product-reviews-scraper` SHALL declare `endpoint` as
the actor's own `/owner/slug` path, `request.path` as
`/v2/acts/<owner>~<slug>/runs`, an input binding over the scaffolded mirror,
and a `usage.model` whose lines are the events the actor publishes, pinned at
the Business-tier rate. No Shopee doc SHALL declare a lifecycle,
`input.toRequest`, `output.fromResponse` or `usage.consolidate`.

#### Scenario: Shared chain settles the derived fold
- **WHEN** any Shopee doc replays the provider's `run-succeeded` chain with
  its `test-inputs.json` body
- **THEN** it settles 200 with usage equal to the model's fold over its
  `CHAIN_COUNTS` (or `{default_dataset_item: 2}` for the search doc), every
  flat line at 1, and two output rows

### Requirement: Estimates are deduced from the binding
The search doc SHALL require `maxItems` and the reviews doc SHALL require
`maxReviewsPerProduct` with a floor of 1. The detail and reviews docs SHALL
read `startUrls` as the multiplier, an absent or empty list estimating zero
metered units.

#### Scenario: The product cap is the estimate
- **WHEN** `apify#gio21/shopee-scraper` is estimated with `maxItems: 40`
- **THEN** the evidence is `{default_dataset_item: 40, actor_start: 1}`

#### Scenario: The per-URL cap multiplies by the URLs
- **WHEN** `apify#zen-studio/shopee-product-reviews-scraper` is estimated
  with two `startUrls` and `maxReviewsPerProduct: 50`
- **THEN** the evidence is
  `{reviews: 100, default_dataset_item: 100, actor_start: 1}`

#### Scenario: An unbounded or missing cap is rejected before the wire
- **WHEN** the reviews doc runs with `maxReviewsPerProduct: 0`, or without
  it, or the search doc runs without `maxItems`
- **THEN** the run fails INVALID_INPUT before any wire call

### Requirement: The detail actor's reviews add-on is not reachable
`apify#zen-studio/shopee-product-detail-scraper` SHALL reject
`includeReviews: true` at the binding, SHALL NOT model the actor's `reviews`
event, and the drift suite SHALL list that event as excluded for the doc with
its reason.

#### Scenario: The add-on is rejected before the wire
- **WHEN** the detail doc runs with `includeReviews: true`
- **THEN** the run fails INVALID_INPUT before any wire call

#### Scenario: The published card still passes coverage
- **WHEN** the drift suite checks the detail doc against a card publishing
  `result`, `reviews`, `apify-default-dataset-item` and `apify-actor-start`
- **THEN** there is no coverage finding

### Requirement: Only delivered products and reviews bill their line
The detail doc SHALL count `result` as the rows whose `listingStatus` is
`available`, the reviews doc SHALL count `reviews` as the rows carrying
`reviewId`, and both SHALL count `default_dataset_item` as every row.

#### Scenario: Unavailable and unreadable listings are not billed as products
- **WHEN** the detail doc settles five rows of which two are `available`,
  one `unavailable`, one `unknown` and one carries no status
- **THEN** the evidence is
  `{result: 2, default_dataset_item: 5, actor_start: 1}`

#### Scenario: A warning row is not billed as a review
- **WHEN** the reviews doc settles three review rows and one `_warning` row
- **THEN** the evidence is
  `{reviews: 3, default_dataset_item: 4, actor_start: 1}`

#### Scenario: An empty run costs the start fee
- **WHEN** the reviews doc settles zero rows
- **THEN** the evidence is
  `{reviews: 0, default_dataset_item: 0, actor_start: 1}`
