import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'
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
      201: z.object({ data: authUserSchema }),
    },
  },
  login: {
    method: 'POST' as const,
    path: '/api/v1/auth/login',
    tags: ['Auth'],
    body: loginBodySchema,
    responses: {
      200: z.object({ data: authTokensSchema }),
    },
  },
} satisfies RouteMap
