import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  productSchema,
  createProductBodySchema,
  updateProductBodySchema,
  productQuerySchema,
  productParamsSchema,
} from '@/modules/products/schemas/index.js'
import { apiErrorSchema } from '@/common/schemas/index.js'
import * as controller from '@/modules/products/controllers/product.controller.js'

const productsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', {
    schema: {
      tags: ['Products'],
      summary: 'List all products',
      security: [{ bearerAuth: [] }],
      querystring: productQuerySchema,
      response: {
        200: z.object({
          data: z.array(productSchema),
          meta: z.object({ page: z.number(), limit: z.number(), total: z.number() }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.getProducts,
  })

  fastify.get('/:id', {
    schema: {
      tags: ['Products'],
      summary: 'Get a product by ID',
      security: [{ bearerAuth: [] }],
      params: productParamsSchema,
      response: {
        200: z.object({ data: productSchema }),
        404: apiErrorSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.getProductById,
  })

  fastify.post('/', {
    schema: {
      tags: ['Products'],
      summary: 'Create a new product',
      security: [{ bearerAuth: [] }],
      body: createProductBodySchema,
      response: {
        201: z.object({ data: productSchema }),
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.createProduct,
  })

  fastify.patch('/:id', {
    schema: {
      tags: ['Products'],
      summary: 'Update a product',
      security: [{ bearerAuth: [] }],
      params: productParamsSchema,
      body: updateProductBodySchema,
      response: {
        200: z.object({ data: productSchema }),
        404: apiErrorSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.updateProduct,
  })

  fastify.delete('/:id', {
    schema: {
      tags: ['Products'],
      summary: 'Delete a product',
      security: [{ bearerAuth: [] }],
      params: productParamsSchema,
      response: {
        204: z.null(),
        404: apiErrorSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.deleteProduct,
  })
}

export default productsRoutes
