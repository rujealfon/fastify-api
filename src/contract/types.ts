import { z } from 'zod'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface RouteSchema<
  TQuery extends z.ZodType | undefined = undefined,
  TParams extends z.ZodType | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
  TResponses extends Record<number, z.ZodType> = Record<number, z.ZodType>,
> {
  method: HttpMethod
  path: string
  auth?: boolean
  query?: TQuery
  params?: TParams
  body?: TBody
  responses: TResponses
}

export type RouteMap = Record<string, {
  method: HttpMethod
  path: string
  auth?: boolean
  tags?: string[]
  query?: z.ZodType
  params?: z.ZodType
  body?: z.ZodType
  responses: Record<number, z.ZodType>
}>

const apiErrorFieldSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  code: z.string(),
  message: z.string(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.array(apiErrorFieldSchema).optional(),
  }),
})

export function apiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  })
}

export function apiListSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
    }),
  })
}

export type ApiError = z.infer<typeof apiErrorSchema>
