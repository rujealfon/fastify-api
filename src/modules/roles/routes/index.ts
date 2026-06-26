import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { PERMISSIONS } from '@/common/constants/index.js'
import { apiErrorSchema, apiListSchema, apiSuccessSchema, uuidParamSchema } from '@/common/schemas/index.js'
import { logAudit } from '@/modules/audit-logs/helpers/log-audit.js'
import { createRoleBodySchema, roleSchema, updateRoleBodySchema } from '@/modules/roles/schemas/index.js'
import * as roleService from '@/modules/roles/services/role.service.js'

const rolePermParamsSchema = z.object({ id: z.uuid(), permId: z.uuid() })

const rolesRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const requireRead = [fastify.authenticate, fastify.requirePermission(PERMISSIONS.ROLE.READ_ANY)]
  const requireCreate = [fastify.authenticate, fastify.requirePermission(PERMISSIONS.ROLE.CREATE_ANY)]
  const requireUpdate = [fastify.authenticate, fastify.requirePermission(PERMISSIONS.ROLE.UPDATE_ANY)]
  const requireDelete = [fastify.authenticate, fastify.requirePermission(PERMISSIONS.ROLE.DELETE_ANY)]

  fastify.get('/api/v1/roles', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], response: { 200: apiListSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema } },
    preValidation: requireRead,
    handler: async (request) => {
      const data = await roleService.findAllRoles(request.server.db)
      return { success: true as const, data, pagination: { page: 1, limit: data.length, total: data.length } }
    },
  })

  fastify.get('/api/v1/roles/:id', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: uuidParamSchema, response: { 200: apiSuccessSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: requireRead,
    handler: async request => ({ success: true as const, data: await roleService.findRoleById(request.server.db, request.params.id) }),
  })

  fastify.post('/api/v1/roles', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], body: createRoleBodySchema, response: { 201: apiSuccessSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema, 409: apiErrorSchema } },
    preValidation: requireCreate,
    handler: async (request, reply) => {
      const data = await roleService.createRole(request.server.db, request.body)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'role.created', resourceType: 'role', resourceId: data.id })
      return reply.status(201).send({ success: true as const, data })
    },
  })

  fastify.patch('/api/v1/roles/:id', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: uuidParamSchema, body: updateRoleBodySchema, response: { 200: apiSuccessSchema(roleSchema), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema, 409: apiErrorSchema } },
    preValidation: requireUpdate,
    handler: async (request) => {
      const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
      const data = await roleService.updateRole(request.server.db, request.params.id, request.body, isSuperAdmin)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'role.updated', resourceType: 'role', resourceId: data.id })
      return { success: true as const, data }
    },
  })

  fastify.delete('/api/v1/roles/:id', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: uuidParamSchema, response: { 204: z.null(), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: requireDelete,
    handler: async (request, reply) => {
      await roleService.deleteRole(request.server.db, request.params.id)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'role.deleted', resourceType: 'role', resourceId: request.params.id })
      return reply.status(204).send(null)
    },
  })

  fastify.post('/api/v1/roles/:id/permissions/:permId', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: rolePermParamsSchema, response: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: requireUpdate,
    handler: async (request) => {
      const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
      await roleService.assignPermissionToRole(request.server.db, request.params.id, request.params.permId, isSuperAdmin)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'permission.assigned', resourceType: 'role', resourceId: request.params.id, metadata: { permId: request.params.permId } })
      return { success: true as const, data: null }
    },
  })

  fastify.delete('/api/v1/roles/:id/permissions/:permId', {
    schema: { tags: ['Roles'], security: [{ cookieAuth: [] }, { bearerAuth: [] }], params: rolePermParamsSchema, response: { 200: apiSuccessSchema(z.null()), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema } },
    preValidation: requireUpdate,
    handler: async (request) => {
      const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
      await roleService.removePermissionFromRole(request.server.db, request.params.id, request.params.permId, isSuperAdmin)
      logAudit(request.server.db, { userId: request.requestContext.get('userId'), action: 'permission.removed', resourceType: 'role', resourceId: request.params.id, metadata: { permId: request.params.permId } })
      return { success: true as const, data: null }
    },
  })
}

export default rolesRoutes
