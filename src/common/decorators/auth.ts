import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { and, eq, isNull } from 'drizzle-orm'
import fp from 'fastify-plugin'
import { ROLES } from '@/common/constants/index.js'
import { userRoles, users } from '@/db/schema/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    optionalAuthenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requirePermission: (permission: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

async function populateRequestContext(request: FastifyRequest): Promise<boolean> {
  try {
    await request.jwtVerify()
  }
  catch {
    return false
  }

  const payload = request.user as { sub?: string, id?: string }
  const userId = payload.sub ?? payload.id
  if (!userId)
    return false

  const [activeUser] = await request.server.db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1)
  if (!activeUser)
    return false

  // ponytail: add Redis cache when DB query becomes a bottleneck
  const userRoleRows = await request.server.db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: {
      role: { with: { rolePermissions: { with: { permission: true } } } },
    },
  })

  const isSuperAdmin = userRoleRows.some(r => r.role.name === ROLES.SUPER_ADMIN)
  const permissions = [
    ...new Set(
      userRoleRows.flatMap(r =>
        r.role.rolePermissions.map(rp =>
          `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`,
        ),
      ),
    ),
  ]

  request.requestContext.set('userId', userId)
  request.requestContext.set('permissions', permissions)
  request.requestContext.set('isSuperAdmin', isSuperAdmin)
  return true
}

const authDecorator: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const ok = await populateRequestContext(request)
    if (!ok)
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } })
  })

  fastify.decorate('optionalAuthenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    await populateRequestContext(request)
  })

  fastify.decorate('requirePermission', (permission: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.requestContext.get('isSuperAdmin'))
        return
      const perms = request.requestContext.get('permissions') ?? []
      if (!perms.includes(permission)) {
        return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
      }
    }
  })
}

export default fp(authDecorator, { name: 'auth-decorator' })
