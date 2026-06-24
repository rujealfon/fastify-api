import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { PERMISSIONS } from '@/common/constants/index.js'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import { createRoleBodySchema, roleDetailSchema, roleSchema, updateRolePermissionsBodySchema } from '@/modules/roles/schemas/index.js'

export const rolesSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/roles',
    tags: ['Roles'],
    permission: PERMISSIONS.ROLES_MANAGE,
    query: paginationQuerySchema,
    responses: {
      200: apiListSchema(roleSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
    },
  },
  get: {
    method: 'GET' as const,
    path: '/api/v1/roles/:id',
    tags: ['Roles'],
    permission: PERMISSIONS.ROLES_MANAGE,
    params: uuidParamSchema,
    responses: {
      200: apiSuccessSchema(roleDetailSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
  create: {
    method: 'POST' as const,
    path: '/api/v1/roles',
    tags: ['Roles'],
    permission: PERMISSIONS.ROLES_MANAGE,
    body: createRoleBodySchema,
    responses: {
      201: apiSuccessSchema(roleDetailSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      409: apiErrorSchema,
    },
  },
  updatePermissions: {
    method: 'PUT' as const,
    path: '/api/v1/roles/:id/permissions',
    tags: ['Roles'],
    permission: PERMISSIONS.ROLES_MANAGE,
    params: uuidParamSchema,
    body: updateRolePermissionsBodySchema,
    responses: {
      200: apiSuccessSchema(roleDetailSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
  delete: {
    method: 'DELETE' as const,
    path: '/api/v1/roles/:id',
    tags: ['Roles'],
    permission: PERMISSIONS.ROLES_MANAGE,
    params: uuidParamSchema,
    responses: {
      204: z.null(),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
      409: apiErrorSchema,
    },
  },
} satisfies RouteMap
