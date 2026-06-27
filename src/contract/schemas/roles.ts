import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'

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

const roleSchema = z.object({ id: z.uuid(), name: z.string(), description: z.string().nullable(), isSystemRole: z.boolean(), createdAt: z.iso.datetime() })
const createRoleBodySchema = z.object({ name: z.string().min(1).max(100), description: z.string().optional() })
const updateRoleBodySchema = z.object({ name: z.string().min(1).max(100).optional(), description: z.string().nullable().optional() })
const rolePermParamsSchema = z.object({ id: z.uuid(), permId: z.uuid() })

export const rolesSchema = {
  list: { method: 'GET' as const, path: '/api/v1/roles', tags: ['Roles'], permission: 'role:read:any', responses: { 200: apiListSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
  get: { method: 'GET' as const, path: '/api/v1/roles/:id', tags: ['Roles'], permission: 'role:read:any', params: uuidParamSchema, responses: { 200: apiSuccessSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  create: { method: 'POST' as const, path: '/api/v1/roles', tags: ['Roles'], permission: 'role:create:any', body: createRoleBodySchema, responses: { 201: apiSuccessSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema, 409: apiErrorSchema } },
  update: { method: 'PATCH' as const, path: '/api/v1/roles/:id', tags: ['Roles'], permission: 'role:update:any', params: uuidParamSchema, body: updateRoleBodySchema, responses: { 200: apiSuccessSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema, 409: apiErrorSchema } },
  delete: { method: 'DELETE' as const, path: '/api/v1/roles/:id', tags: ['Roles'], permission: 'role:delete:any', params: uuidParamSchema, responses: { 204: z.null(), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  assignPermission: { method: 'POST' as const, path: '/api/v1/roles/:id/permissions/:permId', tags: ['Roles'], permission: 'role:update:any', params: rolePermParamsSchema, responses: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  removePermission: { method: 'DELETE' as const, path: '/api/v1/roles/:id/permissions/:permId', tags: ['Roles'], permission: 'role:update:any', params: rolePermParamsSchema, responses: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
} satisfies RouteMap
