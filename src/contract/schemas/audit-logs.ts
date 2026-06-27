import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { PERMISSIONS } from '@/contract/types.js'

const paginationQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(10) })
const uuidParamSchema = z.object({ id: z.uuid() })
const paginationSchema = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int() })
const apiErrorSchema = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), fields: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), code: z.string(), message: z.string() })).optional() }) })
function apiListSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: paginationSchema,
  })
}

const auditLogSchema = z.object({ id: z.uuid(), userId: z.uuid().nullable(), action: z.string(), resourceType: z.string(), resourceId: z.uuid().nullable(), metadata: z.record(z.string(), z.unknown()).nullable(), createdAt: z.iso.datetime() })

export const auditLogsSchema = {
  list: { method: 'GET' as const, path: '/api/v1/audit-logs', tags: ['Audit Logs'], permission: PERMISSIONS.AUDIT_LOG.READ_ANY, query: paginationQuerySchema, responses: { 200: apiListSchema(auditLogSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
  listForUser: { method: 'GET' as const, path: '/api/v1/users/:id/audit-logs', tags: ['Audit Logs'], auth: true, params: uuidParamSchema, query: paginationQuerySchema, responses: { 200: apiListSchema(auditLogSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
} satisfies RouteMap
