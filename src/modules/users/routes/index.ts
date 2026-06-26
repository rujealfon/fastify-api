import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { PERMISSIONS } from '@/common/constants/index.js'
import { ForbiddenError } from '@/common/errors/AppError.js'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import { logAudit } from '@/modules/audit-logs/helpers/log-audit.js'
import { createUserBodySchema, updateUserBodySchema, userSchema } from '@/modules/users/schemas/index.js'
import * as userService from '@/modules/users/services/user.service.js'

// Allow if actor has the :any permission OR is modifying their own account
function assertSelfOrAdmin(request: FastifyRequest, targetId: string, anyPerm: string) {
  const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
  const perms = request.requestContext.get('permissions') ?? []
  const actorId = request.requestContext.get('userId')
  // ponytail: own-scope check — :any goes through requirePermission at route level
  if (!isSuperAdmin && !perms.includes(anyPerm) && actorId !== targetId)
    throw new ForbiddenError('You can only modify your own account')
}

const userRoleParamsSchema = z.object({ id: z.uuid(), roleId: z.uuid() })

const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const requireCreate = [fastify.authenticate, fastify.requirePermission(PERMISSIONS.USER.CREATE_ANY)]
  const requireRoleUpdate = [fastify.authenticate, fastify.requirePermission(PERMISSIONS.ROLE.UPDATE_ANY)]

  fastify.get('/api/v1/users', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], querystring: paginationQuerySchema, response: { 200: apiListSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
    preValidation: [fastify.authenticate, fastify.requirePermission(PERMISSIONS.USER.READ_ANY)],
    handler: async (request) => {
      const { page, limit } = request.query
      const { data, total } = await userService.findAllUsers(request.server.db, page, limit)
      return { success: true as const, data, pagination: { page, limit, total } }
    },
  })

  fastify.get('/api/v1/users/:id', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: uuidParamSchema, response: { 200: apiSuccessSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      assertSelfOrAdmin(request, request.params.id, PERMISSIONS.USER.READ_ANY)
      const user = await userService.findUserById(request.server.db, request.params.id)
      return { success: true as const, data: user }
    },
  })

  fastify.post('/api/v1/users', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], body: createUserBodySchema, response: { 201: apiSuccessSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema, 409: apiErrorSchema } },
    preValidation: requireCreate,
    handler: async (request, reply) => {
      const user = await userService.createUser(request.server.db, request.body)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'user.created', resourceType: 'user', resourceId: user.id, metadata: { email: user.email } })
      return reply.status(201).send({ success: true as const, data: user })
    },
  })

  fastify.patch('/api/v1/users/:id', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: uuidParamSchema, body: updateUserBodySchema, response: { 200: apiSuccessSchema(userSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema, 409: apiErrorSchema } },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      assertSelfOrAdmin(request, request.params.id, PERMISSIONS.USER.UPDATE_ANY)
      const user = await userService.updateUser(request.server.db, request.params.id, request.body)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'user.updated', resourceType: 'user', resourceId: request.params.id, metadata: { changes: request.body } })
      return { success: true as const, data: user }
    },
  })

  fastify.delete('/api/v1/users/:id', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: uuidParamSchema, response: { 204: z.null(), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: fastify.authenticate,
    handler: async (request, reply) => {
      assertSelfOrAdmin(request, request.params.id, PERMISSIONS.USER.DELETE_ANY)
      const actorId = request.requestContext.get('userId')
      await userService.deleteUser(request.server.db, request.params.id, actorId)
      logAudit(request.server.db, { userId: actorId, action: 'user.deleted', resourceType: 'user', resourceId: request.params.id })
      return reply.status(204).send(null)
    },
  })

  fastify.post('/api/v1/users/:id/roles/:roleId', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: userRoleParamsSchema, response: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: requireRoleUpdate,
    handler: async (request) => {
      const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
      await userService.assignRoleToUser(request.server.db, request.params.id, request.params.roleId, isSuperAdmin)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'role.assigned', resourceType: 'user', resourceId: request.params.id, metadata: { roleId: request.params.roleId } })
      return { success: true as const, data: null }
    },
  })

  fastify.delete('/api/v1/users/:id/roles/:roleId', {
    schema: { tags: ['Users'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: userRoleParamsSchema, response: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: requireRoleUpdate,
    handler: async (request) => {
      const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
      await userService.removeRoleFromUser(request.server.db, request.params.id, request.params.roleId, isSuperAdmin)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'role.removed', resourceType: 'user', resourceId: request.params.id, metadata: { roleId: request.params.roleId } })
      return { success: true as const, data: null }
    },
  })
}

export default usersRoutes
