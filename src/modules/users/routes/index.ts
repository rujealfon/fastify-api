import { ROLES } from '@/common/constants/index.js'
import { ForbiddenError } from '@/common/errors/ForbiddenError.js'
import { usersSchema } from '@/contract/schemas/users.js'
import * as userService from '@/modules/users/services/user.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

// A user may modify/delete their own account; admins may act on anyone.
function assertSelfOrAdmin(request: { requestContext: { get: (k: 'userId' | 'role') => string | undefined } }, targetId: string) {
  const role = request.requestContext.get('role')
  const actorId = request.requestContext.get('userId')
  if (role !== ROLES.ADMIN && actorId !== targetId)
    throw new ForbiddenError('You can only modify your own account')
}

export default createFastifyRpcPlugin(usersSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const { data, total } = await userService.findAllUsers(request.server.db, page, limit)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total } } }
  },

  get: async ({ params, request }) => {
    const user = await userService.findUserById(request.server.db, params.id)
    return { status: 200 as const, body: { success: true as const, data: user } }
  },

  create: async ({ body, request }) => {
    const user = await userService.createUser(request.server.db, body)
    return { status: 201 as const, body: { success: true as const, data: user } }
  },

  update: async ({ params, body, request }) => {
    assertSelfOrAdmin(request, params.id)
    const user = await userService.updateUser(request.server.db, params.id, body)
    return { status: 200 as const, body: { success: true as const, data: user } }
  },

  delete: async ({ params, request }) => {
    assertSelfOrAdmin(request, params.id)
    const actorId = request.requestContext.get('userId') as string | undefined
    await userService.deleteUser(request.server.db, params.id, actorId)
    return { status: 204 as const, body: null }
  },
})
