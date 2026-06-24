import { permissionsSchema } from '@/contract/schemas/permissions.js'
import * as permissionsService from '@/modules/permissions/services/permissions.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(permissionsSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const { data, total } = await permissionsService.findAllPermissions(request.server.db, page, limit)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total } } }
  },

  create: async ({ body, request }) => {
    const perm = await permissionsService.createPermission(request.server.db, body)
    return { status: 201 as const, body: { success: true as const, data: perm } }
  },
})
