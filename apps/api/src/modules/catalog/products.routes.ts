import { createProductSchema, productListQuerySchema, uuidSchema } from '@dealforge/shared';
import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { errors } from '../../lib/errors.js';
import { sendOk } from '../../lib/http.js';
import { parseOrThrow } from '../../lib/validate.js';
import { requirePermission } from '../../middleware/authorize.js';
import type { ProductService } from './products.service.js';

/** /api/v1/products: list, create and read catalog products (DF-011). */
export function createProductsRouter(service: ProductService): Router {
  const router = Router();

  router.get(
    '/',
    requirePermission('catalog:read'),
    asyncHandler(async (req, res) => {
      const query = parseOrThrow(productListQuerySchema, req.query);
      const page = await service.list(req.auth!.user, query);
      sendOk(res, page.items, 200, { total: page.total, page: query.page, limit: query.limit });
    }),
  );

  router.post(
    '/',
    requirePermission('catalog:write'),
    asyncHandler(async (req, res) => {
      const input = parseOrThrow(createProductSchema, req.body);
      sendOk(res, await service.create(req.auth!.user, input, req.requestId), 201);
    }),
  );

  router.get(
    '/:id',
    requirePermission('catalog:read'),
    asyncHandler(async (req, res) => {
      const id = uuidSchema.safeParse(req.params.id);
      if (!id.success) throw errors.notFound('Product');
      sendOk(res, await service.get(req.auth!.user, id.data));
    }),
  );

  return router;
}
