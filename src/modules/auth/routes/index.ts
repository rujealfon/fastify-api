import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import * as controller from '@/modules/auth/controllers/auth.controller.js'
import { authTokensSchema, authUserSchema, loginBodySchema, registerBodySchema } from '@/modules/auth/schemas/index.js'

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: registerBodySchema,
      response: {
        201: z.object({ data: authUserSchema }),
      },
    },
    handler: controller.register,
  })

  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login and receive a JWT',
      body: loginBodySchema,
      response: {
        200: z.object({ data: authTokensSchema }),
      },
    },
    handler: controller.login,
  })
}

export default authRoutes
