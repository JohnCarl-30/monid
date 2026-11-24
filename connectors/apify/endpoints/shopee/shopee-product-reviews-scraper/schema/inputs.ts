import { z } from "zod";

/**
 * zen-studio/shopee-product-reviews-scraper — actor input schema, scaffolded from the actor's PUBLISHED
 * input schema (GET /v2/acts/zen-studio~shopee-product-reviews-scraper/builds/default →
 * actorDefinition.input) on 2026-11-24 via scripts/apify-scaffold.ts; curated
 * by hand thereafter (re-run the script to refresh; the drift suite
 * flags divergence — deno task drift). Non-strict by policy: the actor
 * accepts supersets — unknown fields pass through.
 */
export const zShopeeProductReviewsScraperBody = z.object({
    // curated: requestListSources editor — items are { url } request
    // objects (the actor's own prefill); the item shape is unpublished
    startUrls: z.array(z.any()).describe(
        "Paste Shopee product page URLs (the links that contain -i.<shop>.<item>). One product per URL. The market is detected automatically from each URL, so you can mix markets in a single run.Example: https://shopee.co.id/product-i.42255190.2257643102",
    ).optional(),
    maxReviewsPerProduct: z.number().int().min(0).describe(
        "How many reviews to collect per product. Leave at 0 to collect the full available history (can be many thousands on popular products). The most recent reviews are returned first.On a free Apify plan every run returns a sample instead: the first page of one product, up to 20 reviews, whatever you ...",
    ).optional(),
    starFilter: z.enum(["all", "5", "4", "3", "2", "1"]).describe(
        "Collect only reviews with this star rating, or all.",
    ).optional(),
    contentFilter: z.enum(["all", "with comments", "with media", "local"])
        .describe("Collect only reviews matching this content type, or all.")
        .optional(),
    // curated: the hidden `feedback` field is left out of the mirror — it
    // is a free-text note relayed to the actor's maintainers ("For AI
    // agents…"), not a scraping parameter, and a catalog entry for it
    // would invite callers to send context to a third party
});
