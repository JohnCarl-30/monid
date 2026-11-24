import { defineEndpoint, Unit, UsageModelKind } from "@shared/core";
import { z } from "zod";
import { zShopeeProductDetailScraperBody } from "./schema/inputs.ts";
import { zShopeeProductDetailScraperOutput } from "./schema/output.ts";

/**
 * zen-studio/shopee-product-detail-scraper — Get Shopee Product Details.
 *
 * PURE DATA: the async machinery (lifecycle + fromError) is inherited
 * leaf-wise from the apify provider; the actorId is baked into the start
 * path (owner/name → owner~name, the Apify composite-id form). The card
 * has two metered lines, so the doc carries its own usage.evidence.
 */
export default defineEndpoint({
    meta: {
        displayName: "Get Shopee Product Details",
        summary: "Fetch the full Shopee product record by product URL: " +
            "price, per-variant stock, specifications, and shop profile.",
        description:
            "Fetches the complete product record for one or more Shopee " +
            "product page URLs (the links containing -i.<shop>.<item>); " +
            "the market and currency are read from each URL, so markets " +
            "can be mixed in one call. Returns one row per URL: live and " +
            "pre-discount price, discount, per-variant price and stock, " +
            "units sold, rating and star breakdown, description, " +
            "specifications, brand, category path, promotions, and the " +
            "shop's profile and trust signals. It does not return review " +
            "text: use apify#zen-studio/shopee-product-reviews-scraper " +
            "for that, and apify#gio21/shopee-scraper to find product " +
            "URLs by keyword, shop, or category.",
        docsUrl: "https://apify.com/zen-studio/shopee-product-detail-scraper",
        categories: ["shopee"],
        notes: [
            "Billing: one product event per row whose listingStatus is " +
            "available. A URL that cannot be read, or a listing that is " +
            "gone, still comes back as a row (with _warning and enriched " +
            "false) and is not billed the product rate.",
            "includeReviews is rejected at the binding: the actor writes " +
            "reviews to a separate dataset that this endpoint does not " +
            "return, and bills each one.",
            "Per-row status fields say why a value is empty (stockStatus, " +
            "salesStatus, ratingStatus, cardStatus): an empty figure is " +
            "not a zero.",
            "Units sold are published for Brazil and Indonesia only. The " +
            "vendor reports that Vietnam returns no product data at " +
            "present (2026-11); those rows are delivered flagged and " +
            "unbilled.",
            "includeShopVouchers adds the shop's coupons and makes Brazil " +
            "and Indonesia products slower to collect.",
        ],
    },
    /** PUBLIC identity (design D22): the actor's own owner/slug path;
     *  request.path carries the Store slug verbatim. */
    endpoint: "/zen-studio/shopee-product-detail-scraper",
    request: {
        method: "POST",
        path: "/v2/acts/zen-studio~shopee-product-detail-scraper/runs",
    },
    // the actor's own published default run timeout exceeds the
    // provider's 300 s budget (defaultRunOptions.timeoutSecs, 2026-11-24)
    timeouts: { runMs: 3_600_000 },
    input: {
        schema: {
            // maxReviewsPerProduct only tunes the rejected add-on, so it
            // is dropped from the documented input
            body: zShopeeProductDetailScraperBody.omit({
                maxReviewsPerProduct: true,
            }).extend({
                // the reviews add-on, NARROWED at the binding: the actor
                // writes reviews to a separate named `reviews` dataset
                // (its own README and input text, 2026-11-24) while the
                // provider lifecycle returns the DEFAULT dataset only, so
                // `true` would bill per review for rows the caller never
                // receives. The `reviews` event is EXCLUDED in the drift
                // suite for the same reason.
                includeReviews: z.literal(false).describe(
                    "Not supported on this endpoint: reviews land in a " +
                        "separate dataset it does not return. Use " +
                        "apify#zen-studio/shopee-product-reviews-scraper.",
                ).optional(),
            }),
        },
    },
    // Published dataset-item schema (design D29): passthrough
    // DOCUMENTATION — the actor currently publishes an EMPTY field map, so
    // this documents nothing yet; it is wired so the drift suite reports
    // the fields the day they are published.
    output: { schema: zShopeeProductDetailScraperOutput },
    usage: {
        /** The published card (design D29) minus the binding-rejected
         *  `reviews` add-on: ids normalize from the event names (D28),
         *  amounts are the Business-tier rates. */
        model: {
            kind: UsageModelKind.COMPOSITE,
            components: {
                actor_start: {
                    kind: UsageModelKind.PER_CALL,
                    label: "actor start",
                    // vendor charge event: "apify-actor-start"
                    // /v2/acts pricingInfo 2026-11-24 (effective 2026-10-21)
                    consumes: { credit: "default", amount: 0.008 },
                },
                result: {
                    kind: UsageModelKind.PER_UNIT,
                    unit: Unit.RESULT,
                    label: "products",
                    description: "one per delivered product record",
                    // vendor charge event: "result"
                    // Business-tier (GOLD) price, /v2/acts pricingInfo
                    // 2026-11-24 (effective 2026-10-21)
                    consumes: { credit: "default", amount: 0.00699 },
                },
                default_dataset_item: {
                    kind: UsageModelKind.PER_UNIT,
                    unit: Unit.RESULT,
                    label: "stored rows",
                    description:
                        "the platform's per-row dataset charge — every pushed " +
                        "row, warning rows included",
                    // vendor charge event: "apify-default-dataset-item"
                    // /v2/acts pricingInfo 2026-11-24 (effective 2026-10-21)
                    consumes: { credit: "default", amount: 0.00001 },
                },
            },
        },
        /** One product per URL — startUrls is the multiplier, read with
         *  honest optionality: an empty batch estimates 0 (D25). */
        estimate: ({ data }) => {
            const products = data.input.body.startUrls?.length ?? 0;
            return {
                counts: { result: products, default_dataset_item: products },
            };
        },
        /** OVERRIDES the provider evidence (per-line story for this card).
         *  The actor's README (2026-11-24): "Rows that are not `available`
         *  are never charged" — unreadable URLs and gone listings are
         *  delivered as rows carrying `_warning` and `enriched: false`. */
        evidence: ({ data, utils }) => {
            const rows = Array.isArray(data.output) ? data.output : [];
            const products = rows.filter((row) =>
                utils.json.optionalGet(row, "$.listingStatus") === "available"
            ).length;
            return {
                counts: { result: products, default_dataset_item: rows.length },
            };
        },
    },
});
