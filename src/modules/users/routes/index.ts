import { usersSchema } from '@/contract/schemas/users.js'
import * as userService from '@/modules/users/services/user.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(usersSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const data = await userService.findAllUsers(request.server.db, page, limit)
    return { status: 200 as const, body: { data, meta: { page, limit, total: data.length } } }
  },

  get: async ({ params, request }) => {
    const user = await userService.findUserById(request.server.db, params.id)
    return { status: 200 as const, body: { data: user } }
  },

  create: async ({ body, request }) => {
    const user = await userService.createUser(request.server.db, body)
    return { status: 201 as const, body: { data: user } }
  },

  update: async ({ params, body, request }) => {
    const user = await userService.updateUser(request.server.db, params.id, body)
    return { status: 200 as const, body: { data: user } }
  },

  delete: async ({ params, request }) => {
    await userService.deleteUser(request.server.db, params.id)
    return { status: 204 as const, body: null }
  },
})
