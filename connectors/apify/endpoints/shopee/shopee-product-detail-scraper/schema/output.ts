import { z } from "zod";

/**
 * zen-studio/shopee-product-detail-scraper — dataset ITEM schema, scaffolded from the actor's
 * PUBLISHED storages.dataset.fields on 2026-11-24 via
 * scripts/apify-scaffold.ts. Passthrough DOCUMENTATION (design D29):
 * non-strict, every field optional ("required" stripped) — output
 * validation can never fail a paid run over vendor drift; the drift
 * suite reports field additions/removals informationally.
 */
export const zShopeeProductDetailScraperOutputItem = z.any();
/** Tolerant by construction: an item that drifts off the documented
 *  shape still passes as a plain object — validation can NEVER fail a
 *  paid run; the typed branch is the documentation. */
export const zShopeeProductDetailScraperOutput = z.array(
    zShopeeProductDetailScraperOutputItem.or(z.record(z.string(), z.unknown())),
);
