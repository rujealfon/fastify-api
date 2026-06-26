import { rolesSchema } from '@/contract/schemas/roles.js'
import * as roleService from '@/modules/roles/services/role.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(rolesSchema, {
  list: async ({ request }) => {
    const data = await roleService.findAllRoles(request.server.db)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page: 1, limit: data.length, total: data.length } } }
  },

  get: async ({ params, request }) => {
    const data = await roleService.findRoleById(request.server.db, params.id)
    return { status: 200 as const, body: { success: true as const, data } }
  },

  create: async ({ body, request }) => {
    const data = await roleService.createRole(request.server.db, body)
    return { status: 201 as const, body: { success: true as const, data } }
  },

  update: async ({ params, body, request }) => {
    const data = await roleService.updateRole(request.server.db, params.id, body)
    return { status: 200 as const, body: { success: true as const, data } }
  },

  delete: async ({ params, request }) => {
    await roleService.deleteRole(request.server.db, params.id)
    return { status: 204 as const, body: null }
  },

  assignPermission: async ({ params, request }) => {
    await roleService.assignPermissionToRole(request.server.db, params.id, params.permId)
    return { status: 200 as const, body: { success: true as const, data: null } }
  },

  removePermission: async ({ params, request }) => {
    await roleService.removePermissionFromRole(request.server.db, params.id, params.permId)
    return { status: 200 as const, body: { success: true as const, data: null } }
  },
})
