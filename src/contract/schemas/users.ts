import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { PERMISSIONS } from '@/contract/types.js'

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

const profileSchema = z.object({ firstName: z.string().nullable(), lastName: z.string().nullable(), avatarUrl: z.string().nullable(), bio: z.string().nullable(), phoneNumber: z.string().nullable(), birthDate: z.string().nullable() })
const embeddedRoleSchema = z.object({ id: z.uuid(), name: z.string() })
const userSchema = z.object({ id: z.uuid(), email: z.email(), profile: profileSchema, roles: z.array(embeddedRoleSchema), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() })
const createUserBodySchema = z.object({ email: z.email(), password: z.string().min(8).max(72) })
const updateProfileBodySchema = z.object({ firstName: z.string().nullable().optional(), lastName: z.string().nullable().optional(), avatarUrl: z.url().nullable().optional(), bio: z.string().nullable().optional(), phoneNumber: z.string().nullable().optional(), birthDate: z.string().nullable().optional() })
const updateUserBodySchema = z.object({ email: z.email().optional(), profile: updateProfileBodySchema.optional() }).refine(data => data.email !== undefined || data.profile !== undefined, { message: 'At least one field must be provided (email or profile)' })
const userRoleParamsSchema = z.object({ id: z.uuid(), roleId: z.uuid() })

export const usersSchema = {
  list: { method: 'GET' as const, path: '/api/v1/users', tags: ['Users'], permission: PERMISSIONS.USER.READ_ANY, query: paginationQuerySchema, responses: { 200: apiListSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
  get: { method: 'GET' as const, path: '/api/v1/users/:id', tags: ['Users'], auth: true, params: uuidParamSchema, responses: { 200: apiSuccessSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  create: { method: 'POST' as const, path: '/api/v1/users', tags: ['Users'], permission: PERMISSIONS.USER.CREATE_ANY, body: createUserBodySchema, responses: { 201: apiSuccessSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema, 409: apiErrorSchema } },
  update: { method: 'PATCH' as const, path: '/api/v1/users/:id', tags: ['Users'], auth: true, params: uuidParamSchema, body: updateUserBodySchema, responses: { 200: apiSuccessSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema, 409: apiErrorSchema } },
  delete: { method: 'DELETE' as const, path: '/api/v1/users/:id', tags: ['Users'], auth: true, params: uuidParamSchema, responses: { 204: z.null(), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  assignRole: { method: 'POST' as const, path: '/api/v1/users/:id/roles/:roleId', tags: ['Users'], permission: PERMISSIONS.ROLE.UPDATE_ANY, params: userRoleParamsSchema, responses: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
  removeRole: { method: 'DELETE' as const, path: '/api/v1/users/:id/roles/:roleId', tags: ['Users'], permission: PERMISSIONS.ROLE.UPDATE_ANY, params: userRoleParamsSchema, responses: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
} satisfies RouteMap
