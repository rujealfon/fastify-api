import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { PERMISSIONS } from '@/common/constants/index.js'
import { ForbiddenError } from '@/common/errors/AppError.js'
import { apiErrorSchema, apiListSchema, paginationQuerySchema, uuidParamSchema } from '@/common/schemas/index.js'
import { auditLogSchema } from '@/modules/audit-logs/schemas/index.js'
import { findAuditLogs } from '@/modules/audit-logs/services/audit-log.service.js'

const auditLogsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/v1/audit-logs', {
    schema: {
      tags: ['Audit Logs'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      querystring: paginationQuerySchema,
      response: { 200: apiListSchema(auditLogSchema), 401: apiErrorSchema, 403: apiErrorSchema },
    },
    preValidation: [fastify.authenticate, fastify.requirePermission(PERMISSIONS.AUDIT_LOG.READ_ANY)],
    handler: async (request) => {
      const { page, limit } = request.query
      const { data, total } = await findAuditLogs(request.server.db, page, limit)
      return { success: true as const, data, pagination: { page, limit, total } }
    },
  })

  fastify.get('/api/v1/users/:id/audit-logs', {
    schema: {
      tags: ['Audit Logs'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      params: uuidParamSchema,
      querystring: paginationQuerySchema,
      response: { 200: apiListSchema(auditLogSchema), 401: apiErrorSchema, 403: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      const isSuperAdmin = request.requestContext.get('isSuperAdmin') ?? false
      const perms = request.requestContext.get('permissions') ?? []
      const actorId = request.requestContext.get('userId')
      if (!isSuperAdmin && !perms.includes(PERMISSIONS.USER.READ_ANY) && actorId !== request.params.id)
        throw new ForbiddenError('You can only view your own audit log')

      const { page, limit } = request.query
      const { data, total } = await findAuditLogs(request.server.db, page, limit, request.params.id)
      return { success: true as const, data, pagination: { page, limit, total } }
    },
  })
}

export default auditLogsRoutes
