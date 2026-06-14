import { z } from 'zod'
import { paginationQuerySchema, uuidParamSchema } from '../../../common/schemas/index.js'

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.string(),
  stock: z.number().int(),
  createdAt: z.string().datetime(),
})

export const createProductBodySchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  stock: z.number().int().min(0).default(0),
})

export const updateProductBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export { paginationQuerySchema as productQuerySchema, uuidParamSchema as productParamsSchema }

export type Product = z.infer<typeof productSchema>
export type CreateProductBody = z.infer<typeof createProductBodySchema>
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>
