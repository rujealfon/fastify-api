import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { PERMISSIONS } from '@/common/constants/index.js'
import { apiErrorSchema, apiListSchema } from '@/common/schemas/index.js'
import { permissionSchema } from '@/modules/permissions/schemas/index.js'
import { findAllPermissions } from '@/modules/permissions/services/permission.service.js'

const permissionsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/v1/permissions', {
    schema: {
      tags: ['Permissions'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      response: { 200: apiListSchema(permissionSchema), 401: apiErrorSchema, 403: apiErrorSchema },
    },
    preValidation: [fastify.authenticate, fastify.requirePermission(PERMISSIONS.PERMISSION.READ_ANY)],
    handler: async (request) => {
      const data = await findAllPermissions(request.server.db)
      return { success: true as const, data, pagination: { page: 1, limit: data.length, total: data.length } }
    },
  })
}

export default permissionsRoutes
