# Tasks: add-apify-shopee-actors

## 1. Drill the actors

- [x] 1.1 Pull each actor's public record (`/v2/acts/{id}`, 2026-11-24):
      effective pricingInfo, default run options, 30-day run stats; confirm
      each is `PAY_PER_EVENT`
- [x] 1.2 Read each actor's published README and input text for its charge
      sites, row shape, unbilled-row markers and separate datasets (the
      sources are not public)
- [x] 1.3 Hold back `xtracto/shopee-scraper` (compute billed on top of the
      card; start fee priced per GB at 4 GB; actor-name collision)

## 2. Schemas

- [x] 2.1 Scaffold `schema/inputs.ts` + `schema/output.ts` from the public
      build endpoint (token-free); unquote identifier keys
- [x] 2.2 Curate: `stringList` fields typed as strings, HTML entities
      decoded, the hidden `feedback` field left out

## 3. Endpoints (3)

- [x] 3.1 Single-metered: gio21/shopee-scraper (`maxItems` required)
- [x] 3.2 Multi-metered with own evidence:
      zen-studio/shopee-product-detail-scraper (`includeReviews` pinned
      false), zen-studio/shopee-product-reviews-scraper
      (`maxReviewsPerProduct` required, floored at 1)

## 4. Drift suite

- [x] 4.1 `EXCLUDED`: the detail doc's `reviews` event, with its reason
      (+ tests)
- [x] 4.2 Run the suite against the public API: the three docs report `ok`

## 5. Wiring + tests

- [x] 5.1 `connectors/categories.ts`: shopee
- [x] 5.2 `test-inputs.json` rows (public inputs only); `CHAIN_COUNTS` rows
      for the two multi-metered docs; `ids.lock.json` (+3, nothing else)
- [x] 5.3 Estimate spot checks, binding-gate checks and per-line settle
      tests in `lifecycle.test.ts`
- [x] 5.4 Verify: fmt · lint · check · test · double-compile byte-identity ·
      version:check · catalog smoke

## 6. Follow-ups

- [ ] 6.1 Live run of each doc on a paid Apify account to confirm the
      evidence markers and the settled charge against the card
- [ ] 6.2 Decide `xtracto/shopee-scraper` (see the proposal's non-goals)
