import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateProductBody, UpdateProductBody } from '../schemas/index.js'
import type { PaginationQuery, UuidParam } from '../../../common/schemas/index.js'
import * as productService from '../services/product.service.js'

export async function getProducts(
  request: FastifyRequest<{ Querystring: PaginationQuery }>,
  _reply: FastifyReply,
) {
  const { page, limit } = request.query
  const data = await productService.findAllProducts(request.server.db, page, limit)
  return { data, meta: { page, limit, total: data.length } }
}

export async function getProductById(
  request: FastifyRequest<{ Params: UuidParam }>,
  _reply: FastifyReply,
) {
  const product = await productService.findProductById(request.server.db, request.params.id)
  return { data: product }
}

export async function createProduct(
  request: FastifyRequest<{ Body: CreateProductBody }>,
  reply: FastifyReply,
) {
  const product = await productService.createProduct(request.server.db, request.body)
  return reply.status(201).send({ data: product })
}

export async function updateProduct(
  request: FastifyRequest<{ Params: UuidParam; Body: UpdateProductBody }>,
  _reply: FastifyReply,
) {
  const product = await productService.updateProduct(
    request.server.db,
    request.params.id,
    request.body,
  )
  return { data: product }
}

export async function deleteProduct(
  request: FastifyRequest<{ Params: UuidParam }>,
  reply: FastifyReply,
) {
  await productService.deleteProduct(request.server.db, request.params.id)
  return reply.status(204).send()
}
