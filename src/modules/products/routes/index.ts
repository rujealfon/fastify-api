import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import { logAudit } from '@/modules/audit-logs/helpers/log-audit.js'
import { createProductBodySchema, productSchema, updateProductBodySchema } from '@/modules/products/schemas/index.js'
import * as productService from '@/modules/products/services/product.service.js'

const productsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/v1/products', {
    schema: {
      tags: ['Products'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: { 200: apiListSchema(productSchema), 401: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      const { page, limit } = request.query
      const { data, total } = await productService.findAllProducts(request.server.db, page, limit)
      return { success: true as const, data, pagination: { page, limit, total } }
    },
  })

  fastify.get('/api/v1/products/:id', {
    schema: {
      tags: ['Products'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      params: uuidParamSchema,
      response: { 200: apiSuccessSchema(productSchema), 401: apiErrorSchema, 404: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      const product = await productService.findProductById(request.server.db, request.params.id)
      return { success: true as const, data: product }
    },
  })

  fastify.post('/api/v1/products', {
    schema: {
      tags: ['Products'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      body: createProductBodySchema,
      response: { 201: apiSuccessSchema(productSchema), 401: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request, reply) => {
      const product = await productService.createProduct(request.server.db, request.body)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'product.created', resourceType: 'product', resourceId: product.id, metadata: { name: product.name, price: product.price } })
      return reply.status(201).send({ success: true as const, data: product })
    },
  })

  fastify.patch('/api/v1/products/:id', {
    schema: {
      tags: ['Products'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      params: uuidParamSchema,
      body: updateProductBodySchema,
      response: { 200: apiSuccessSchema(productSchema), 401: apiErrorSchema, 404: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      const product = await productService.updateProduct(request.server.db, request.params.id, request.body)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'product.updated', resourceType: 'product', resourceId: request.params.id, metadata: { changes: request.body } })
      return { success: true as const, data: product }
    },
  })

  fastify.delete('/api/v1/products/:id', {
    schema: {
      tags: ['Products'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      params: uuidParamSchema,
      response: { 204: z.null(), 401: apiErrorSchema, 404: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request, reply) => {
      const product = await productService.deleteProduct(request.server.db, request.params.id)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'product.deleted', resourceType: 'product', resourceId: request.params.id, metadata: { name: product.name, price: product.price } })
      return reply.status(204).send(null)
    },
  })
}

export default productsRoutes
