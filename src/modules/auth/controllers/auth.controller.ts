import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegisterBody, LoginBody } from '@/modules/auth/schemas/index.js'
import * as authService from '@/modules/auth/services/auth.service.js'

export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
) {
  const user = await authService.registerUser(request.server.db, request.body)
  return reply.status(201).send({ data: user })
}

export async function login(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) {
  const user = await authService.loginUser(request.server.db, request.body)
  const token = await reply.jwtSign({ sub: user.id, email: user.email })
  return { data: { token } }
}
