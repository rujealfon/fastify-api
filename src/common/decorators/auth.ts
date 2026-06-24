import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { Permission } from '@/common/constants/index.js'
import { and, eq } from 'drizzle-orm'
import fp from 'fastify-plugin'
import { ROLES } from '@/common/constants/index.js'
import { permissions, rolePermissions, roles } from '@/db/schema/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requirePermission: (permission: Permission) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
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

  fastify.decorate('requirePermission', (permission: Permission) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const roleName = request.requestContext.get('role') ?? ROLES.USER
      // ponytail: DB query per check, add Redis cache if latency matters
      const [row] = await request.server.db
        .select({ id: roles.id })
        .from(roles)
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(and(eq(roles.name, roleName), eq(permissions.key, permission)))
        .limit(1)
      if (!row) {
        reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
      }
    }
  })
}

export default fp(authDecorator, { name: 'auth-decorator' })
