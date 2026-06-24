import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import {
  createUserBodySchema,
  updateUserBodySchema,
  updateUserRoleBodySchema,
  userSchema,
} from '@/modules/users/schemas/index.js'

export const usersSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/users',
    tags: ['Users'],
    admin: true,
    query: paginationQuerySchema,
    responses: {
      200: apiListSchema(userSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
    },
  },
  get: {
    method: 'GET' as const,
    path: '/api/v1/users/:id',
    tags: ['Users'],
    admin: true,
    params: uuidParamSchema,
    responses: {
      200: apiSuccessSchema(userSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
  create: {
    method: 'POST' as const,
    path: '/api/v1/users',
    tags: ['Users'],
    admin: true,
    body: createUserBodySchema,
    responses: {
      201: apiSuccessSchema(userSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      409: apiErrorSchema,
    },
  },
  update: {
    method: 'PATCH' as const,
    path: '/api/v1/users/:id',
    tags: ['Users'],
    auth: true,
    params: uuidParamSchema,
    body: updateUserBodySchema,
    responses: {
      200: apiSuccessSchema(userSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
      409: apiErrorSchema,
    },
  },
  delete: {
    method: 'DELETE' as const,
    path: '/api/v1/users/:id',
    tags: ['Users'],
    auth: true,
    params: uuidParamSchema,
    responses: {
      204: z.null(),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
  updateRole: {
    method: 'PATCH' as const,
    path: '/api/v1/users/:id/role',
    tags: ['Users'],
    admin: true,
    params: uuidParamSchema,
    body: updateUserRoleBodySchema,
    responses: {
      200: apiSuccessSchema(userSchema),
      401: apiErrorSchema,
      403: apiErrorSchema,
      404: apiErrorSchema,
    },
  },
} satisfies RouteMap
