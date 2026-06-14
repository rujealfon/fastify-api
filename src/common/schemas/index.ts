import { z } from 'zod'

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
})

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  code: z.string(),
  message: z.string(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type UuidParam = z.infer<typeof uuidParamSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
