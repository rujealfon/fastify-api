import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authDecorator: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    }
    catch {
      reply.status(401).send({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid or missing token' })
    }
  })
}

export default fp(authDecorator, { name: 'auth-decorator' })
