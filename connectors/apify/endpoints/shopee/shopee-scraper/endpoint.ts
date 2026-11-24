import { defineEndpoint, Unit, UsageModelKind } from "@shared/core";
import { zShopeeScraperBody } from "./schema/inputs.ts";

/**
 * gio21/shopee-scraper — Search Shopee Products.
 *
 * PURE DATA: the async machinery (lifecycle + fromError + the generic
 * usage.evidence) is inherited leaf-wise from the apify provider; the
 * actorId is baked into the start path (owner/name → owner~name, the
 * Apify composite-id form).
 */
export default defineEndpoint({
    meta: {
        displayName: "Search Shopee Products",
        summary: "Scrape Shopee product listings by keyword, shop, or " +
            "category across eight markets.",
        description:
            "Scrapes Shopee product listings by search keyword, shop URL, " +
            "or category URL in Brazil, Indonesia, Thailand, Malaysia, " +
            "Singapore, the Philippines, Vietnam, and Mexico. Returns one " +
            "row per product: name, price, discount, units sold, " +
            "favorites, rating, review count, images, and seller. Use it " +
            "to discover products and compare listings; it returns " +
            "listing-card data, not the full product page. For one " +
            "product's complete record (per-variant stock, " +
            "specifications, shop profile) use " +
            "apify#zen-studio/shopee-product-detail-scraper, and for " +
            "review text use apify#zen-studio/shopee-product-reviews-scraper.",
        docsUrl: "https://apify.com/gio21/shopee-scraper",
        categories: ["shopee"],
        notes: [
            "maxItems is the total cap across every keyword, shop, and " +
            "category in the call (10 to 10000), and every returned product " +
            "is billed.",
            "One keyword yields at most about 150 unique products and one " +
            "shop about 200; pass several specific keywords or a category " +
            "URL to reach more.",
            "country selects the Shopee domain when no URL is given and " +
            "falls back to BR when omitted.",
            "priceSlicing re-runs each keyword and category across six " +
            "price buckets: more unique products, about six times the " +
            "runtime.",
        ],
    },
    /** PUBLIC identity (design D22): the actor's own owner/slug path;
     *  request.path carries the Store slug verbatim. */
    endpoint: "/gio21/shopee-scraper",
    request: {
        method: "POST",
        path: "/v2/acts/gio21~shopee-scraper/runs",
    },
    // the actor's own published default run timeout exceeds the
    // provider's 300 s budget (defaultRunOptions.timeoutSecs, 2026-11-24)
    timeouts: { runMs: 900_000 },
    input: {
        schema: {
            // maxItems is the primary limiting knob (total products per
            // call) — WE require it at the binding (inner
            // int/min(10)/max(10000) kept by .required, zod 4): the
            // estimate must be deducible to price the hold (D25)
            body: zShopeeScraperBody.required({ maxItems: true }),
        },
    },
    usage: {
        /** The WHOLE published card (design D29): every charge event the
         *  actor publishes is a line, ids normalize from the event names
         *  (D28). Both events are published at one price for every plan. */
        model: {
            kind: UsageModelKind.COMPOSITE,
            components: {
                actor_start: {
                    kind: UsageModelKind.PER_CALL,
                    label: "actor start",
                    // vendor charge event: "apify-actor-start"
                    // /v2/acts pricingInfo 2026-11-24 (effective 2026-11-20)
                    consumes: { credit: "default", amount: 0.00005 },
                },
                default_dataset_item: {
                    kind: UsageModelKind.PER_UNIT,
                    unit: Unit.RESULT,
                    label: "products",
                    // vendor charge event: "apify-default-dataset-item"
                    // /v2/acts pricingInfo 2026-11-24 (effective 2026-11-20:
                    // $5 per 1,000 products on every plan)
                    consumes: { credit: "default", amount: 0.005 },
                },
            },
        },
        /** maxItems = the total product cap — required at the binding,
         *  so the estimate is pure arithmetic (D25). */
        estimate: ({ data }) => ({
            counts: { default_dataset_item: data.input.body.maxItems },
        }),
    },
});
