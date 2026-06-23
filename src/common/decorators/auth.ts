import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { ROLES } from '@/common/constants/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authDecorator: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
      const payload = request.user as { sub?: string, id?: string, role?: string }
      // RFC 7519 uses 'sub'; legacy tokens from older sign() calls used 'id'.
      const userId = payload.sub ?? payload.id
      if (userId) {
        request.requestContext.set('userId', userId)
      }
      request.requestContext.set('role', payload.role ?? ROLES.USER)
    }
    catch {
      reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } })
    }
  })

  // Must run after `authenticate` in the preValidation chain.
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.requestContext.get('role') !== ROLES.ADMIN) {
      reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } })
    }
  })
}

export default fp(authDecorator, { name: 'auth-decorator' })
