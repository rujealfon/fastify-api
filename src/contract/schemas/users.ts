import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
import { apiErrorSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import {
  createUserBodySchema,
  updateUserBodySchema,
  userSchema,
} from '@/modules/users/schemas/index.js'

const metaSchema = z.object({ page: z.number(), limit: z.number(), total: z.number() })

export const usersSchema = {
  list: {
    method: 'GET' as const,
    path: '/api/v1/users',
    auth: true,
    query: paginationQuerySchema,
    responses: {
      200: z.object({ data: z.array(userSchema), meta: metaSchema }),
    },
  },
  get: {
    method: 'GET' as const,
    path: '/api/v1/users/:id',
    auth: true,
    params: uuidParamSchema,
    responses: {
      200: z.object({ data: userSchema }),
      404: apiErrorSchema,
    },
  },
  create: {
    method: 'POST' as const,
    path: '/api/v1/users',
    body: createUserBodySchema,
    responses: {
      201: z.object({ data: userSchema }),
      409: apiErrorSchema,
    },
  },
  update: {
    method: 'PATCH' as const,
    path: '/api/v1/users/:id',
    auth: true,
    params: uuidParamSchema,
    body: updateUserBodySchema,
    responses: {
      200: z.object({ data: userSchema }),
      404: apiErrorSchema,
    },
  },
  delete: {
    method: 'DELETE' as const,
    path: '/api/v1/users/:id',
    auth: true,
    params: uuidParamSchema,
    responses: {
      204: z.null(),
      404: apiErrorSchema,
    },
  },
} satisfies RouteMap
