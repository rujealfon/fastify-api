import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'

const paginationQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(10) })
const uuidParamSchema = z.object({ id: z.uuid() })
const paginationSchema = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int() })
const apiErrorSchema = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), fields: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), code: z.string(), message: z.string() })).optional() }) })
function apiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  })
}
function apiListSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: paginationSchema,
  })
}

const productSchema = z.object({ id: z.uuid(), name: z.string(), price: z.string(), stock: z.number().int(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() })
const createProductBodySchema = z.object({ name: z.string().min(1).max(200), price: z.number().min(0), stock: z.number().int().min(0).default(0) })
const updateProductBodySchema = z.object({ name: z.string().min(1).max(200).optional(), price: z.number().min(0).optional(), stock: z.number().int().min(0).optional() }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' })

export const productsSchema = {
  list: { method: 'GET' as const, path: '/api/v1/products', tags: ['Products'], permission: 'product:read:any', query: paginationQuerySchema, responses: { 200: apiListSchema(productSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
  get: { method: 'GET' as const, path: '/api/v1/products/:id', tags: ['Products'], permission: 'product:read:any', params: uuidParamSchema, responses: { 200: apiSuccessSchema(productSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  create: { method: 'POST' as const, path: '/api/v1/products', tags: ['Products'], permission: 'product:create:any', body: createProductBodySchema, responses: { 201: apiSuccessSchema(productSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
  update: { method: 'PATCH' as const, path: '/api/v1/products/:id', tags: ['Products'], permission: 'product:update:any', params: uuidParamSchema, body: updateProductBodySchema, responses: { 200: apiSuccessSchema(productSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  delete: { method: 'DELETE' as const, path: '/api/v1/products/:id', tags: ['Products'], permission: 'product:delete:any', params: uuidParamSchema, responses: { 204: z.null(), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
} satisfies RouteMap
