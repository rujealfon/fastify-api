import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { apiErrorSchema, apiSuccessSchema } from '@/common/schemas/index.js'
import { userSchema } from '@/modules/users/schemas/index.js'
import { findUserById } from '@/modules/users/services/user.service.js'

const profileRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/api/v1/profile', {
    schema: {
      tags: ['Profile'],
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      response: { 200: apiSuccessSchema(userSchema), 401: apiErrorSchema },
    },
    preValidation: fastify.authenticate,
    handler: async (request) => {
      const userId = request.requestContext.get('userId') as string
      const user = await findUserById(request.server.db, userId)
      return { success: true as const, data: user }
    },
  })
}

export default profileRoutes
