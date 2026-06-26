import type { FastifyReply } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ForbiddenError } from '@/common/errors/AppError.js'
import { apiErrorSchema, apiSuccessSchema } from '@/common/schemas/index.js'
import { logAudit } from '@/modules/audit-logs/helpers/log-audit.js'
import { authUserSchema, loginBodySchema, loginResponseSchema, registerBodySchema } from '@/modules/auth/schemas/index.js'
import * as authService from '@/modules/auth/services/auth.service.js'

function signToken(user: { id: string, email: string }, reply: FastifyReply) {
  return reply.jwtSign({ sub: user.id, email: user.email })
}

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/api/v1/auth/register', {
    schema: {
      tags: ['Auth'],
      body: registerBodySchema,
      response: { 201: apiSuccessSchema(authUserSchema), 409: apiErrorSchema },
    },
    handler: async (request, reply) => {
      const user = await authService.registerUser(request.server.db, request.body)
      return reply.status(201).send({ success: true as const, data: user })
    },
  })

  fastify.post('/api/v1/auth/login', {
    schema: {
      tags: ['Auth'],
      body: loginBodySchema,
      response: { 200: apiSuccessSchema(authUserSchema), 401: apiErrorSchema },
    },
    handler: async (request, reply) => {
      const user = await authService.loginUser(request.server.db, request.body)
      const token = await signToken(user, reply)
      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: request.server.config.NODE_ENV === 'production',
        sameSite: 'strict',
      })
      logAudit(request.server.db, { userId: user.id, action: 'auth.logged_in', resourceType: 'user', resourceId: user.id, metadata: { email: user.email, ip: request.ip, ua: request.headers['user-agent'] ?? null } })
      return { success: true as const, data: { id: user.id, email: user.email } }
    },
  })

  fastify.post('/api/v1/auth/mobile/login', {
    schema: {
      tags: ['Auth'],
      body: loginBodySchema,
      response: { 200: apiSuccessSchema(loginResponseSchema), 401: apiErrorSchema, 403: apiErrorSchema },
    },
    handler: async (request, reply) => {
      if (request.headers['x-mobile-api-key'] !== request.server.config.MOBILE_API_KEY)
        throw new ForbiddenError('Mobile login is restricted to mobile clients')
      const user = await authService.loginUser(request.server.db, request.body)
      const token = await signToken(user, reply)
      logAudit(request.server.db, { userId: user.id, action: 'auth.logged_in', resourceType: 'user', resourceId: user.id, metadata: { email: user.email, ip: request.ip, ua: request.headers['user-agent'] ?? null } })
      return { success: true as const, data: { id: user.id, email: user.email, token } }
    },
  })

  fastify.post('/api/v1/auth/logout', {
    schema: {
      tags: ['Auth'],
      response: { 200: apiSuccessSchema(z.null()) },
    },
    handler: async (request, reply) => {
      logAudit(request.server.db, { userId: request.requestContext.get('userId') ?? null, action: 'auth.logged_out', resourceType: 'user', metadata: { ip: request.ip, ua: request.headers['user-agent'] ?? null } })
      reply.clearCookie('token', { path: '/' })
      return { success: true as const, data: null }
    },
  })
}

export default authRoutes
