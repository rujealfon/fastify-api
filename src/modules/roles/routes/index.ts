import { rolesSchema } from '@/contract/schemas/roles.js'
import * as rolesService from '@/modules/roles/services/roles.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(rolesSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const { data, total } = await rolesService.findAllRoles(request.server.db, page, limit)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total } } }
  },

  get: async ({ params, request }) => {
    const role = await rolesService.findRoleById(request.server.db, params.id)
    return { status: 200 as const, body: { success: true as const, data: role } }
  },

  create: async ({ body, request }) => {
    const role = await rolesService.createRole(request.server.db, body)
    return { status: 201 as const, body: { success: true as const, data: role } }
  },

  updatePermissions: async ({ params, body, request }) => {
    const role = await rolesService.updateRolePermissions(request.server.db, params.id, body)
    return { status: 200 as const, body: { success: true as const, data: role } }
  },

  delete: async ({ params, request }) => {
    await rolesService.deleteRole(request.server.db, params.id)
    return { status: 204 as const, body: null }
  },
})
