import type { RouteMap } from '@/contract/types.js'
import { apiErrorSchema, apiListSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import { activityLogSchema } from '@/modules/activity-logs/schemas/index.js'

export const activityLogsSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/activity-logs',
    tags: ['Activity Logs'],
    admin: true,
    query: paginationQuerySchema,
    responses: {
      200: apiListSchema(activityLogSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
    },
  },
  listForUser: {
    method: 'GET' as const,
    path: '/api/v1/users/:id/activity-logs',
    tags: ['Activity Logs'],
    auth: true,
    params: uuidParamSchema,
    query: paginationQuerySchema,
    responses: {
      200: apiListSchema(activityLogSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
    },
  },
} satisfies RouteMap
