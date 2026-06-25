import { ROLES } from '@/common/constants/index.js'
import { ForbiddenError } from '@/common/errors/AppError.js'
import { activityLogsSchema } from '@/contract/schemas/activity-logs.js'
import { findActivityLogs } from '@/modules/activity-logs/services/activity-log.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

export default createFastifyRpcPlugin(activityLogsSchema, {
  list: async ({ query, request }) => {
    const { page, limit } = query
    const { data, total } = await findActivityLogs(request.server.db, page, limit)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total } } }
  },

  listForUser: async ({ params, query, request }) => {
    const role = request.requestContext.get('role')
    const actorId = request.requestContext.get('userId')
    if (role !== ROLES.ADMIN && actorId !== params.id)
      throw new ForbiddenError('You can only view your own activity log')

    const { page, limit } = query
    const { data, total } = await findActivityLogs(request.server.db, page, limit, params.id)
    return { status: 200 as const, body: { success: true as const, data, pagination: { page, limit, total } } }
  },
})
