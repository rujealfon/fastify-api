import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { PERMISSIONS } from '@/contract/types.js'

const paginationSchema = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int() })
const apiErrorSchema = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), fields: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), code: z.string(), message: z.string() })).optional() }) })
function apiListSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: paginationSchema,
  })
}

const permissionSchema = z.object({ id: z.uuid(), resource: z.string(), action: z.string(), scope: z.string(), description: z.string().nullable(), createdAt: z.iso.datetime() })

export const permissionsSchema = {
  list: { method: 'GET' as const, path: '/api/v1/permissions', tags: ['Permissions'], permission: PERMISSIONS.PERMISSION.READ_ANY, responses: { 200: apiListSchema(permissionSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
} satisfies RouteMap
