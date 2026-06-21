import type { FastifyRequest } from 'fastify'
import { NotFoundError } from '@/common/errors/NotFoundError.js'
import { UnauthorizedError } from '@/common/errors/UnauthorizedError.js'
import { usersSchema } from '@/contract/schemas/users.js'
import * as userService from '@/modules/users/services/user.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

function assertSelf(request: FastifyRequest, id: string): string {
  const actorId = request.requestContext.get('userId')
  if (!actorId)
    throw new UnauthorizedError()
  if (actorId !== id)
    throw new NotFoundError('User', id)
  return actorId
}

export default createFastifyRpcPlugin(usersSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const data = await userService.findAllUsers(request.server.db, page, limit)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total: data.length } } }
  },

  get: async ({ params, request }) => {
    const user = await userService.findUserById(request.server.db, params.id)
    return { status: 200 as const, body: { success: true as const, data: user } }
  },

  create: async ({ body, request }) => {
    const user = await userService.createUser(request.server.db, body, request.server.config.ACCOUNT_RETENTION_DAYS)
    return { status: 201 as const, body: { success: true as const, data: user } }
  },

  update: async ({ params, body, request }) => {
    assertSelf(request, params.id)
    const user = await userService.updateUser(request.server.db, params.id, body, request.server.config.ACCOUNT_RETENTION_DAYS)
    return { status: 200 as const, body: { success: true as const, data: user } }
  },

  delete: async ({ params, request }) => {
    const actorId = assertSelf(request, params.id)
    await userService.deleteUser(request.server.db, params.id, actorId, request.server.config.ACCOUNT_RETENTION_DAYS)
    return { status: 204 as const, body: null }
  },
})
