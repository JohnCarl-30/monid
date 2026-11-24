import { defineEndpoint, Unit, UsageModelKind } from "@shared/core";
import { zShopeeProductReviewsScraperBody } from "./schema/inputs.ts";
import { zShopeeProductReviewsScraperOutput } from "./schema/output.ts";

/**
 * zen-studio/shopee-product-reviews-scraper — List Shopee Product Reviews.
 *
 * PURE DATA: the async machinery (lifecycle + fromError) is inherited
 * leaf-wise from the apify provider; the actorId is baked into the start
 * path (owner/name → owner~name, the Apify composite-id form). The card
 * has two metered lines, so the doc carries its own usage.evidence.
 */
export default defineEndpoint({
    meta: {
        displayName: "List Shopee Product Reviews",
        summary: "Collect customer reviews for Shopee products by product " +
            "URL, with star and content filters.",
        description:
            "Collects customer reviews for one or more Shopee product page " +
            "URLs (the links containing -i.<shop>.<item>), most recent " +
            "first; the market is read from each URL. Returns one row per " +
            "review: star rating, text, per-aspect sub-ratings (product, " +
            "seller, delivery), buyer photos and videos, the variant " +
            "purchased, the seller's reply, and follow-up reviews. Filter " +
            "by star rating or by content type (with comments, with " +
            "media, local). It returns no product fields: use " +
            "apify#zen-studio/shopee-product-detail-scraper for the " +
            "product record, which also carries the rating total and star " +
            "breakdown without collecting any reviews.",
        docsUrl: "https://apify.com/zen-studio/shopee-product-reviews-scraper",
        categories: ["shopee"],
        notes: [
            "Billing: one review event per review delivered. A run that " +
            "finds no reviews costs only the start fee and any stored " +
            "warning rows.",
            "maxReviewsPerProduct is required and applies per URL, so the " +
            "estimate is the cap times the number of URLs. The actor's own " +
            "0 (full history, many thousands on popular products) is " +
            "rejected at the binding.",
            "The vendor reports that review collection is limited at " +
            "present (2026-11): many runs return none, and Taiwan reviews " +
            "are unavailable.",
            "A URL that is not a product page comes back as a row with " +
            "_warning and no review.",
            "The actor's per-product rating summary is written to a " +
            "separate dataset and is not returned here.",
        ],
    },
    /** PUBLIC identity (design D22): the actor's own owner/slug path;
     *  request.path carries the Store slug verbatim. */
    endpoint: "/zen-studio/shopee-product-reviews-scraper",
    request: {
        method: "POST",
        path: "/v2/acts/zen-studio~shopee-product-reviews-scraper/runs",
    },
    // the actor's own published default run timeout exceeds the
    // provider's 300 s budget (defaultRunOptions.timeoutSecs, 2026-11-24)
    timeouts: { runMs: 7_200_000 },
    input: {
        schema: {
            body: zShopeeProductReviewsScraperBody.extend({
                // maxReviewsPerProduct is the primary limiting knob and the
                // actor documents 0 = the full available history — floored
                // at 1 and REQUIRED at the binding (.unwrap() drops the
                // optional wrapper), so the caller states the cap and the
                // estimate is deducible (D25); re-described, since the
                // mirror's text still offers the 0 this binding refuses
                maxReviewsPerProduct: zShopeeProductReviewsScraperBody.shape
                    .maxReviewsPerProduct.unwrap().min(1).describe(
                        "How many reviews to collect per product URL, most " +
                            "recent first. Required, at least 1: every " +
                            "review delivered is billed.",
                    ),
            }),
        },
    },
    // Published dataset-item schema (design D29): passthrough
    // DOCUMENTATION — the actor currently publishes an EMPTY field map, so
    // this documents nothing yet; it is wired so the drift suite reports
    // the fields the day they are published.
    output: { schema: zShopeeProductReviewsScraperOutput },
    usage: {
        /** The WHOLE published card (design D29): every charge event the
         *  actor publishes is a line, ids normalize from the event names
         *  (D28), amounts are the Business-tier rates. */
        model: {
            kind: UsageModelKind.COMPOSITE,
            components: {
                actor_start: {
                    kind: UsageModelKind.PER_CALL,
                    label: "actor start",
                    // vendor charge event: "apify-actor-start"
                    // /v2/acts pricingInfo 2026-11-24 (effective 2026-06-25)
                    consumes: { credit: "default", amount: 0.008 },
                },
                reviews: {
                    kind: UsageModelKind.PER_UNIT,
                    unit: Unit.RESULT,
                    label: "reviews",
                    description: "one per customer review delivered",
                    // vendor charge event: "reviews"
                    // Business-tier (GOLD) price, /v2/acts pricingInfo
                    // 2026-11-24 (effective 2026-06-25)
                    consumes: { credit: "default", amount: 0.00299 },
                },
                default_dataset_item: {
                    kind: UsageModelKind.PER_UNIT,
                    unit: Unit.RESULT,
                    label: "stored rows",
                    description:
                        "the platform's per-row dataset charge — every pushed " +
                        "row, warning rows included",
                    // vendor charge event: "apify-default-dataset-item"
                    // /v2/acts pricingInfo 2026-11-24 (effective 2026-06-25)
                    consumes: { credit: "default", amount: 0.00001 },
                },
            },
        },
        /** The per-URL cap × the URLs — startUrls is the multiplier, read
         *  with honest optionality: an empty batch estimates 0 (D25). */
        estimate: ({ data }) => {
            const body = data.input.body;
            const reviews = body.maxReviewsPerProduct *
                (body.startUrls?.length ?? 0);
            return {
                counts: { reviews, default_dataset_item: reviews },
            };
        },
        /** OVERRIDES the provider evidence (per-line story for this card).
         *  A review row carries `reviewId`; the rows the actor's README
         *  (2026-11-24) says are unbilled — `_warning` rows for rejected
         *  URLs or a used-up free sample, and the maintenance notice row —
         *  do not. */
        evidence: ({ data, utils }) => {
            const rows = Array.isArray(data.output) ? data.output : [];
            const reviews = rows.filter((row) =>
                utils.json.optionalGet(row, "$.reviewId") !== undefined
            ).length;
            return {
                counts: { reviews, default_dataset_item: rows.length },
            };
        },
    },
});
