import { z } from 'zod'
export { apiErrorSchema, apiListSchema, apiSuccessSchema } from '@/contract/types.js'
export type { ApiError } from '@/contract/types.js'

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).meta({ examples: [1] }),
  limit: z.coerce.number().int().min(1).max(100).default(10).meta({ examples: [10] }),
})

export const uuidParamSchema = z.object({
  id: z.uuid().meta({ examples: ['019ee4e4-bd7d-7e0d-8402-eeb73c578a00'] }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type UuidParam = z.infer<typeof uuidParamSchema>
