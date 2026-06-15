import { z } from 'zod'
import { paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const createUserBodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(72),
})

export const updateUserBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.email().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export { uuidParamSchema as userParamsSchema, paginationQuerySchema as userQuerySchema }

export type User = z.infer<typeof userSchema>
export type CreateUserBody = z.infer<typeof createUserBodySchema>
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
