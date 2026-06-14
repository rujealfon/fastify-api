import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  userSchema,
  createUserBodySchema,
  updateUserBodySchema,
  userQuerySchema,
  userParamsSchema,
} from '../schemas/index.js'
import { apiErrorSchema } from '../../../common/schemas/index.js'
import * as controller from '../controllers/user.controller.js'

const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/', {
    schema: {
      tags: ['Users'],
      summary: 'List all users',
      security: [{ bearerAuth: [] }],
      querystring: userQuerySchema,
      response: {
        200: z.object({
          data: z.array(userSchema),
          meta: z.object({ page: z.number(), limit: z.number(), total: z.number() }),
        }),
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.getUsers,
  })

  fastify.get('/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Get a user by ID',
      security: [{ bearerAuth: [] }],
      params: userParamsSchema,
      response: {
        200: z.object({ data: userSchema }),
        404: apiErrorSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.getUserById,
  })

  fastify.post('/', {
    schema: {
      tags: ['Users'],
      summary: 'Create a new user',
      body: createUserBodySchema,
      response: {
        201: z.object({ data: userSchema }),
        409: apiErrorSchema,
      },
    },
    handler: controller.createUser,
  })

  fastify.patch('/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Update a user',
      security: [{ bearerAuth: [] }],
      params: userParamsSchema,
      body: updateUserBodySchema,
      response: {
        200: z.object({ data: userSchema }),
        404: apiErrorSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.updateUser,
  })

  fastify.delete('/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Delete a user',
      security: [{ bearerAuth: [] }],
      params: userParamsSchema,
      response: {
        204: z.null(),
        404: apiErrorSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: controller.deleteUser,
  })
}

export default usersRoutes
