import type { FastifyReply } from 'fastify'
import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import { ForbiddenError } from '@/common/errors/AppError.js'
import { authSchema } from '@/contract/schemas/auth.js'
import { logAudit } from '@/modules/audit-logs/helpers/log-audit.js'
import * as authService from '@/modules/auth/services/auth.service.js'
import { createFastifyRpcPlugin } from '@/plugins/rpc.js'

function signToken(user: { id: string, email: string }, reply: FastifyReply) {
  return reply.jwtSign({ sub: user.id, email: user.email })
}

export default createFastifyRpcPlugin(authSchema, {
  register: async ({ body, request }) => {
    const user = await authService.registerUser(request.server.db, body)
    return { status: 201 as const, body: { success: true as const, data: user } }
  },

  login: async ({ body, request, reply }) => {
    const user = await authService.loginUser(request.server.db, body)
    const token = await signToken(user, reply)
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: request.server.config.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    logAudit(request.server.db, { userId: user.id, action: 'auth.logged_in', resourceType: 'user', resourceId: user.id, metadata: { ip: request.ip, ua: request.headers['user-agent'] ?? null } })
    return { status: 200 as const, body: { success: true as const, data: { id: user.id, email: user.email } } }
  },

  mobileLogin: async ({ body, request, reply }) => {
    const provided = Buffer.from(request.headers['x-mobile-api-key'] as string ?? '')
    const expected = Buffer.from(request.server.config.MOBILE_API_KEY)
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected))
      throw new ForbiddenError('Mobile login is restricted to mobile clients')
    const user = await authService.loginUser(request.server.db, body)
    const token = await signToken(user, reply)
    logAudit(request.server.db, { userId: user.id, action: 'auth.logged_in', resourceType: 'user', resourceId: user.id, metadata: { ip: request.ip, ua: request.headers['user-agent'] ?? null } })
    return { status: 200 as const, body: { success: true as const, data: { id: user.id, email: user.email, token } } }
  },

  logout: async ({ request, reply }) => {
    const userId = request.requestContext.get('userId') ?? null
    logAudit(request.server.db, { userId, action: 'auth.logged_out', resourceType: userId ? 'user' : 'anonymous', resourceId: userId, metadata: { ip: request.ip, ua: request.headers['user-agent'] ?? null } })
    reply.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: request.server.config.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    return { status: 200 as const, body: { success: true as const, data: null } }
  },
})
