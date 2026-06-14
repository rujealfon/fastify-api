import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkDb } from '../services/health.service.js'

export async function liveness(_request: FastifyRequest, _reply: FastifyReply) {
  return { status: 'ok' }
}

export async function readiness(request: FastifyRequest, reply: FastifyReply) {
  const dbOk = await checkDb(request.server.db)
  if (!dbOk) {
    return reply.status(503).send({ status: 'not_ready', reason: 'database unreachable' })
  }
  return { status: 'ready' }
}
