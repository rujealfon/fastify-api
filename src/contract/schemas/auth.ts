import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'

const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.array(z.object({
      path: z.array(z.union([z.string(), z.number()])),
      code: z.string(),
      message: z.string(),
    })).optional(),
  }),
})

function apiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({ success: z.literal(true), data: dataSchema, message: z.string().optional() })
}

const authUserSchema = z.object({ id: z.uuid(), email: z.email() })
const loginResponseSchema = authUserSchema.extend({ token: z.string() })
const loginBodySchema = z.object({ email: z.email(), password: z.string().min(1) })
const registerBodySchema = z.object({ email: z.email(), password: z.string().min(8).max(72) })

export const authSchema = {
  register: { method: 'POST' as const, path: '/api/v1/auth/register', tags: ['Auth'], rateLimit: { max: 10, timeWindow: '15 minutes' }, body: registerBodySchema, responses: { 201: apiSuccessSchema(authUserSchema), 409: apiErrorSchema, 429: apiErrorSchema } },
  login: { method: 'POST' as const, path: '/api/v1/auth/login', tags: ['Auth'], rateLimit: { max: 10, timeWindow: '15 minutes' }, body: loginBodySchema, responses: { 200: apiSuccessSchema(authUserSchema), 401: apiErrorSchema, 429: apiErrorSchema } },
  mobileLogin: { method: 'POST' as const, path: '/api/v1/auth/mobile/login', tags: ['Auth'], rateLimit: { max: 10, timeWindow: '15 minutes' }, body: loginBodySchema, responses: { 200: apiSuccessSchema(loginResponseSchema), 401: apiErrorSchema, 403: apiErrorSchema, 429: apiErrorSchema } },
  logout: { method: 'POST' as const, path: '/api/v1/auth/logout', tags: ['Auth'], optionalAuth: true, responses: { 200: apiSuccessSchema(z.null()) } },
} satisfies RouteMap
