import type { RouteMap } from '@/contract/types.js'
import { apiErrorSchema, apiSuccessSchema } from '@/common/schemas/index.js'
import {
  authTokensSchema,
  authUserSchema,
  loginBodySchema,
  registerBodySchema,
} from '@/modules/auth/schemas/index.js'

export const authSchema = {
  register: {
    method: 'POST' as const,
    path: '/api/v1/auth/register',
    tags: ['Auth'],
    body: registerBodySchema,
    responses: {
      201: apiSuccessSchema(authUserSchema),
      409: apiErrorSchema,
    },
  },
  login: {
    method: 'POST' as const,
    path: '/api/v1/auth/login',
    tags: ['Auth'],
    body: loginBodySchema,
    responses: {
      200: apiSuccessSchema(authTokensSchema),
      401: apiErrorSchema,
    },
  },
} satisfies RouteMap
