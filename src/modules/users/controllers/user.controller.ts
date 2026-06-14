import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateUserBody, UpdateUserBody } from '../schemas/index.js'
import type { PaginationQuery, UuidParam } from '../../../common/schemas/index.js'
import * as userService from '../services/user.service.js'

export async function getUsers(
  request: FastifyRequest<{ Querystring: PaginationQuery }>,
  _reply: FastifyReply,
) {
  const { page, limit } = request.query
  const data = await userService.findAllUsers(request.server.db, page, limit)
  return { data, meta: { page, limit, total: data.length } }
}

export async function getUserById(
  request: FastifyRequest<{ Params: UuidParam }>,
  _reply: FastifyReply,
) {
  const user = await userService.findUserById(request.server.db, request.params.id)
  return { data: user }
}

export async function createUser(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply,
) {
  const user = await userService.createUser(request.server.db, request.body)
  return reply.status(201).send({ data: user })
}

export async function updateUser(
  request: FastifyRequest<{ Params: UuidParam; Body: UpdateUserBody }>,
  _reply: FastifyReply,
) {
  const user = await userService.updateUser(request.server.db, request.params.id, request.body)
  return { data: user }
}

export async function deleteUser(
  request: FastifyRequest<{ Params: UuidParam }>,
  reply: FastifyReply,
) {
  await userService.deleteUser(request.server.db, request.params.id)
  return reply.status(204).send()
}
