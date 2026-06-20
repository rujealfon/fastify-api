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
      const payload = request.user as { sub?: string, id?: string }
      const userId = payload.sub ?? payload.id
      if (userId) {
        request.requestContext.set('userId', userId)
      }
    }
    catch {
      reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } })
    }
  })
}

export default fp(authDecorator, { name: 'auth-decorator' })
