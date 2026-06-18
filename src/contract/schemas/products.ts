import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { apiErrorSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import {
  createProductBodySchema,
  productSchema,
  updateProductBodySchema,
} from '@/modules/products/schemas/index.js'

const metaSchema = z.object({ page: z.number(), limit: z.number(), total: z.number() })

export const productsSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/products',
    auth: true,
    query: paginationQuerySchema,
    responses: {
      200: z.object({ data: z.array(productSchema), meta: metaSchema }),
    },
  },
  get: {
    method: 'GET' as const,
    path: '/api/v1/products/:id',
    auth: true,
    params: uuidParamSchema,
    responses: {
      200: z.object({ data: productSchema }),
      404: apiErrorSchema,
    },
  },
  create: {
    method: 'POST' as const,
    path: '/api/v1/products',
    auth: true,
    body: createProductBodySchema,
    responses: {
      201: z.object({ data: productSchema }),
    },
  },
  update: {
    method: 'PATCH' as const,
    path: '/api/v1/products/:id',
    auth: true,
    params: uuidParamSchema,
    body: updateProductBodySchema,
    responses: {
      200: z.object({ data: productSchema }),
      404: apiErrorSchema,
    },
  },
  delete: {
    method: 'DELETE' as const,
    path: '/api/v1/products/:id',
    auth: true,
    params: uuidParamSchema,
    responses: {
      204: z.null(),
      404: apiErrorSchema,
    },
  },
} satisfies RouteMap
