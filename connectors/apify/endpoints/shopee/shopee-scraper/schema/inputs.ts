import { z } from "zod";

/**
 * gio21/shopee-scraper — actor input schema, scaffolded from the actor's PUBLISHED
 * input schema (GET /v2/acts/gio21~shopee-scraper/builds/default →
 * actorDefinition.input) on 2026-11-24 via scripts/apify-scaffold.ts; curated
 * by hand thereafter (re-run the script to refresh; the drift suite
 * flags divergence — deno task drift). Non-strict by policy: the actor
 * accepts supersets — unknown fields pass through.
 */
export const zShopeeScraperBody = z.object({
    location: z.string().describe(
        "Shorthand for one-off runs: a single product keyword, Shopee search URL, shop URL, or category URL. Example: 'tênis nike'. For batch scraping use the 'keywords', 'categoryUrls', or 'shopUrls' arrays instead.",
    ).optional(),
    // curated: stringList editor — the three list fields carry plain strings
    keywords: z.array(z.string()).describe(
        'List of search keywords (most reliable mode). Each keyword yields up to ~150 unique items (Shopee API cap). Combine 10–30 specific keywords to scrape thousands of products. Example: ["tênis nike", "camiseta dry fit", "fone bluetooth"].',
    ).optional(),
    shopUrls: z.array(z.string()).describe(
        'Shopee shop/seller URLs. Example: ["https://shopee.com.br/lojaname", "https://shopee.co.id/shop/250649369"]. Returns the shop\'s listing (up to ~200 items per shop across sort orders). For a seller\'s full catalog beyond that, add 5-10 niche keywords.',
    ).optional(),
    categoryUrls: z.array(z.string()).describe(
        'Shopee category URLs. Example: ["https://shopee.com.br/Tenis-cat.11013548"]. Yields more items than keyword search; the actor rotates 4 sort orders for maximum coverage.',
    ).optional(),
    priceSlicing: z.boolean().describe(
        "When true, runs each keyword/category 6× across price buckets in the country's local currency (BRL for BR, THB for TH, IDR for ID, …) to bypass Shopee's per-search dedup cap and pull more unique items. Multiplies bandwidth and runtime ~6×. Example: false.",
    ).optional(),
    country: z.enum(["BR", "ID", "TH", "MY", "SG", "PH", "VN", "MX"]).describe(
        "Country code selecting the Shopee domain. Auto-detected from URLs when present. Example: 'BR' (shopee.com.br).",
    ).optional(),
    maxItems: z.number().int().min(10).max(10000).describe(
        "Hard cap on total items returned across all inputs combined. Per-keyword cap is ~150; multi-keyword + category URLs scale to thousands. Example: 100. Range 10–10000.",
    ).optional(),
    debug: z.boolean().describe(
        "Enable verbose logging for troubleshooting. Leave off for normal runs. Example: false.",
    ).optional(),
});
