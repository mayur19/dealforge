import type {
  CreateProductRequest,
  Product,
  ProductListQuery,
  SessionUser,
} from '@dealforge/shared';
import { withTransaction, type Db } from '../../db/pool.js';
import { errors } from '../../lib/errors.js';
import { isUniqueViolation } from '../../lib/sql.js';
import { recordAudit } from '../audit/audit.service.js';
import { createProductRepository, type ProductPage } from './products.repository.js';

export interface ProductServiceDeps {
  readonly db: Db;
}

/**
 * Catalog use cases (FR-01). Role gates run in the router; this layer owns
 * tenant scoping, uniqueness and the audit record written in the same
 * transaction as the insert (ADR-0008).
 */
export function createProductService({ db }: ProductServiceDeps) {
  const readRepo = createProductRepository(db);

  return {
    list(actor: SessionUser, query: ProductListQuery): Promise<ProductPage> {
      return readRepo.list(actor.organizationId, query.page, query.limit);
    },

    async get(actor: SessionUser, id: string): Promise<Product> {
      const product = await readRepo.findById(actor.organizationId, id);
      if (!product) throw errors.notFound('Product');
      return product;
    },

    async create(
      actor: SessionUser,
      input: CreateProductRequest,
      requestId: string,
    ): Promise<Product> {
      try {
        return await withTransaction(db, async (tx) => {
          const repo = createProductRepository(tx);
          const id = await repo.insert(actor.organizationId, actor.id, input);
          await recordAudit(tx, {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: 'product.created',
            entityType: 'product',
            entityId: id,
            metadata: {
              sku: input.sku,
              listPriceMinor: input.listPriceMinor,
              unitCostMinor: input.unitCostMinor,
            },
            requestId,
          });
          return (await repo.findById(actor.organizationId, id))!;
        });
      } catch (error) {
        if (isUniqueViolation(error, 'products_org_sku_key')) {
          throw errors.conflict(`A product with SKU ${input.sku} already exists`);
        }
        throw error;
      }
    },
  };
}

export type ProductService = ReturnType<typeof createProductService>;
