import type { CreateProductRequest, Product, ProductType } from '@dealforge/shared';
import type { Queryable } from '../../db/pool.js';
import { offsetFor, toSafeInteger } from '../../lib/sql.js';

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  type: ProductType;
  unit: string;
  list_price_minor: string;
  unit_cost_minor: string;
  currency_code: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SELECT_PRODUCT = `
  SELECT p.id, p.sku, p.name, p.category, p.description, p.type, p.unit,
         p.list_price_minor, p.unit_cost_minor, o.currency_code, p.active,
         p.created_at, p.updated_at
    FROM products p
    JOIN organizations o ON o.id = p.organization_id`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    description: row.description,
    type: row.type,
    unit: row.unit,
    listPriceMinor: toSafeInteger(row.list_price_minor, 'list_price_minor'),
    unitCostMinor: toSafeInteger(row.unit_cost_minor, 'unit_cost_minor'),
    currencyCode: row.currency_code,
    active: row.active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export interface ProductPage {
  readonly items: readonly Product[];
  readonly total: number;
}

/**
 * Data access for the product catalog. Every statement is scoped by the
 * caller's organization id (ADR-0003); ids from other tenants simply do not
 * exist from this repository's point of view.
 */
export function createProductRepository(db: Queryable) {
  return {
    async list(organizationId: string, page: number, limit: number): Promise<ProductPage> {
      const [rows, count] = await Promise.all([
        db.query<ProductRow>(
          `${SELECT_PRODUCT} WHERE p.organization_id = $1 ORDER BY p.sku LIMIT $2 OFFSET $3`,
          [organizationId, limit, offsetFor(page, limit)],
        ),
        db.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM products WHERE organization_id = $1',
          [organizationId],
        ),
      ]);
      return { items: rows.rows.map(toProduct), total: count.rows[0]?.total ?? 0 };
    },

    async findById(organizationId: string, id: string): Promise<Product | null> {
      const { rows } = await db.query<ProductRow>(
        `${SELECT_PRODUCT} WHERE p.organization_id = $1 AND p.id = $2`,
        [organizationId, id],
      );
      return rows[0] ? toProduct(rows[0]) : null;
    },

    async insert(
      organizationId: string,
      createdBy: string,
      input: CreateProductRequest,
    ): Promise<string> {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO products (organization_id, sku, name, category, description, type, unit,
                               list_price_minor, unit_cost_minor, active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          organizationId,
          input.sku,
          input.name,
          input.category,
          input.description,
          input.type,
          input.unit,
          input.listPriceMinor,
          input.unitCostMinor,
          input.active,
          createdBy,
        ],
      );
      return rows[0]!.id;
    },
  };
}

export type ProductRepository = ReturnType<typeof createProductRepository>;
