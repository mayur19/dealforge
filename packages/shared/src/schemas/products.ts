import { z } from 'zod';
import { PRICE_TYPES } from '../domain/pricing/types.js';
import { paginationQuerySchema } from './common.js';

/**
 * Product catalog contracts (FR-01). Prices and costs are integer minor units
 * in the organization currency (ADR-0013); JSON numbers with a fractional
 * part, strings and negatives are rejected at the boundary.
 */
export const PRODUCT_TYPES = PRICE_TYPES;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** 1 000 000 000.00 in a 2-digit currency; keeps line math far from 2^53. */
export const MAX_PRODUCT_AMOUNT_MINOR = 100_000_000_000;

export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,63}$/;

const amountMinor = z
  .number({ invalid_type_error: 'Must be an integer amount in minor units' })
  .int('Must be an integer amount in minor units')
  .min(0, 'Must not be negative')
  .max(MAX_PRODUCT_AMOUNT_MINOR, 'Amount is too large');

const text = (max: number) => z.string().trim().min(1, 'Required').max(max);

export const skuSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(SKU_PATTERN, 'SKU must be 2-64 characters: A-Z, 0-9, dot, dash or underscore');

export const createProductSchema = z
  .object({
    sku: skuSchema,
    name: text(200),
    category: text(80),
    description: z.string().trim().max(2000).default(''),
    type: z.enum(PRODUCT_TYPES),
    unit: text(40),
    listPriceMinor: amountMinor,
    unitCostMinor: amountMinor,
    active: z.boolean().default(true),
  })
  .strict();

export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;

export const productSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  type: z.enum(PRODUCT_TYPES),
  unit: z.string(),
  listPriceMinor: z.number().int(),
  unitCostMinor: z.number().int(),
  currencyCode: z.string().length(3),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;

/** TODO(DF-014): add search, status and category filters. */
export const productListQuerySchema = paginationQuerySchema;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
