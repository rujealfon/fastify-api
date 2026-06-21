import { authSchema } from '@/contract/schemas/auth.js'
import * as authService from '@/modules/auth/services/auth.service.js'
import { createUser } from '@/modules/users/services/user.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(authSchema, {
  register: async ({ body, request }) => {
    const user = await createUser(request.server.db, body, request.server.config.ACCOUNT_RETENTION_DAYS)
    return { status: 201 as const, body: { success: true as const, data: user } }
  },

  login: async ({ body, request, reply }) => {
    const user = await authService.loginUser(request.server.db, body)
    const token = await reply.jwtSign({ sub: user.id, email: user.email })
    return { status: 200 as const, body: { success: true as const, data: { token } } }
  },
})
