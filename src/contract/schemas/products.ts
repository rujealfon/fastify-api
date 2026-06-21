import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import {
  createProductBodySchema,
  productSchema,
  updateProductBodySchema,
} from '@/modules/products/schemas/index.js'

export const productsSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/products',
    tags: ['Products'],
    auth: true,
    query: paginationQuerySchema,
    responses: {
      200: apiListSchema(productSchema),
      401: apiErrorSchema,
    },
  },
  get: {
    method: 'GET' as const,
    path: '/api/v1/products/:id',
    tags: ['Products'],
    auth: true,
    params: uuidParamSchema,
    responses: {
      200: apiSuccessSchema(productSchema),
      401: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
  create: {
    method: 'POST' as const,
    path: '/api/v1/products',
    tags: ['Products'],
    auth: true,
    body: createProductBodySchema,
    responses: {
      201: apiSuccessSchema(productSchema),
      401: apiErrorSchema,
    },
  },
  update: {
    method: 'PATCH' as const,
    path: '/api/v1/products/:id',
    tags: ['Products'],
    auth: true,
    params: uuidParamSchema,
    body: updateProductBodySchema,
    responses: {
      200: apiSuccessSchema(productSchema),
      401: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
  delete: {
    method: 'DELETE' as const,
    path: '/api/v1/products/:id',
    tags: ['Products'],
    auth: true,
    params: uuidParamSchema,
    responses: {
      204: z.null(),
      401: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
} satisfies RouteMap
