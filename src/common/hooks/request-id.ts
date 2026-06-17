import type { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'node:crypto'
import fp from 'fastify-plugin'

const requestIdHook: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const id = (request.headers['x-request-id'] as string) ?? randomUUID()
    reply.header('x-request-id', id)
    request.requestContext.set('requestId', id)
  })
}

export default fp(requestIdHook, { name: 'request-id' })
