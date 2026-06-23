import { productsSchema } from '@/contract/schemas/products.js'
import * as productService from '@/modules/products/services/product.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(productsSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const { data, total } = await productService.findAllProducts(request.server.db, page, limit)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total } } }
  },

  get: async ({ params, request }) => {
    const product = await productService.findProductById(request.server.db, params.id)
    return { status: 200 as const, body: { success: true as const, data: product } }
  },

  create: async ({ body, request }) => {
    const product = await productService.createProduct(request.server.db, body)
    return { status: 201 as const, body: { success: true as const, data: product } }
  },

  update: async ({ params, body, request }) => {
    const product = await productService.updateProduct(request.server.db, params.id, body)
    return { status: 200 as const, body: { success: true as const, data: product } }
  },

  delete: async ({ params, request }) => {
    await productService.deleteProduct(request.server.db, params.id)
    return { status: 204 as const, body: null }
  },
})
