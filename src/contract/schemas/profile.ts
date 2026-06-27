import type { RouteMap } from '@/contract/types.js'
import { z } from 'zod'

const apiErrorSchema = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), fields: z.array(z.object({ path: z.array(z.union([z.string(), z.number()])), code: z.string(), message: z.string() })).optional() }) })
function apiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  })
}
const profileSchemaValue = z.object({ firstName: z.string().nullable(), lastName: z.string().nullable(), avatarUrl: z.string().nullable(), bio: z.string().nullable(), phoneNumber: z.string().nullable(), birthDate: z.string().nullable() })
const embeddedRoleSchema = z.object({ id: z.uuid(), name: z.string() })
const userSchema = z.object({ id: z.uuid(), email: z.email(), profile: profileSchemaValue, roles: z.array(embeddedRoleSchema), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() })

export const profileSchema = {
  me: { method: 'GET' as const, path: '/api/v1/profile', tags: ['Profile'], auth: true, responses: { 200: apiSuccessSchema(userSchema), 401: apiErrorSchema } },
} satisfies RouteMap
