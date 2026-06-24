import type { RouteMap } from '@/contract/types.js'
import { PERMISSIONS } from '@/common/constants/index.js'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, paginationQuerySchema } from '@/common/schemas/index.js'
import { createPermissionBodySchema, permissionSchema } from '@/modules/permissions/schemas/index.js'

export const permissionsSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/permissions',
    tags: ['Permissions'],
    permission: PERMISSIONS.ROLES_MANAGE,
    query: paginationQuerySchema,
    responses: {
      200: apiListSchema(permissionSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
    },
  },
  create: {
    method: 'POST' as const,
    path: '/api/v1/permissions',
    tags: ['Permissions'],
    permission: PERMISSIONS.ROLES_MANAGE,
    body: createPermissionBodySchema,
    responses: {
      201: apiSuccessSchema(permissionSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      409: apiErrorSchema,
    },
  },
} satisfies RouteMap
