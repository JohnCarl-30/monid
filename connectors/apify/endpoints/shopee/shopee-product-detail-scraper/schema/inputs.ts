import { z } from "zod";

/**
 * zen-studio/shopee-product-detail-scraper — actor input schema, scaffolded from the actor's PUBLISHED
 * input schema (GET /v2/acts/zen-studio~shopee-product-detail-scraper/builds/default →
 * actorDefinition.input) on 2026-11-24 via scripts/apify-scaffold.ts; curated
 * by hand thereafter (re-run the script to refresh; the drift suite
 * flags divergence — deno task drift). Non-strict by policy: the actor
 * accepts supersets — unknown fields pass through.
 */
export const zShopeeProductDetailScraperBody = z.object({
    // curated: requestListSources editor — items are { url } request
    // objects (the actor's own prefill); the item shape is unpublished
    startUrls: z.array(z.any()).describe(
        "Paste Shopee product page URLs (the links that contain -i.<shop>.<item>). One product per URL. The market and currency are detected automatically from each URL, so you can mix markets in a single run.Copy the full product link from the product page, the one that still has the product ...",
    ).optional(),
    includeReviews: z.boolean().describe(
        "Currently limited: reviews are often unavailable right now and many runs return none. Products are always collected in full, and you are charged only for reviews actually delivered.Also collect customer reviews for each product into a separate reviews dataset: review text, star rating, per-aspect...",
    ).optional(),
    maxReviewsPerProduct: z.number().int().min(1).max(1000).describe(
        "How many recent reviews to collect per product, up to 1000. The rating total and the 1-5 star breakdown are in ratingCount and ratingBreakdown on every product regardless of this setting. Only applies when reviews are enabled.",
    ).optional(),
    includeShopVouchers: z.boolean().describe(
        "The coupons a shop offers on this product: the code, how much it takes off, and the minimum spend to use it. A shopper claims these, so they are not already deducted from the price shown. Turning this on makes products in Brazil and Indonesia slower to collect; every other market includes them ei...",
    ).optional(),
    // curated: the hidden `feedback` field is left out of the mirror — it
    // is a free-text note relayed to the actor's maintainers ("For AI
    // agents…"), not a scraping parameter, and a catalog entry for it
    // would invite callers to send context to a third party
});
