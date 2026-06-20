import type { FastifyReply, FastifyRequest } from 'fastify'
import { checkDb, checkRedis } from '@/modules/health/services/health.service.js'

export async function liveness(_request: FastifyRequest, _reply: FastifyReply) {
  return { status: 'ok' }
}

export async function readiness(request: FastifyRequest, reply: FastifyReply) {
  const [dbOk, redisOk] = await Promise.all([
    checkDb(request.server.db),
    checkRedis(request.server.redis),
  ])

  if (!dbOk || !redisOk) {
    return reply.status(503).send({
      status: 'not_ready',
      reason: !dbOk ? 'database unreachable' : 'redis unreachable',
    })
  }

  return { status: 'ready' }
}

export async function details(request: FastifyRequest, _reply: FastifyReply) {
  const memory = request.server.memoryUsage()
  return {
    status: request.server.isUnderPressure() ? 'degraded' : 'ok',
    memory: {
      heapUsed: memory.heapUsed,
      rssBytes: memory.rssBytes,
      eventLoopDelay: memory.eventLoopDelay,
      eventLoopUtilized: memory.eventLoopUtilized,
    },
    underPressure: request.server.isUnderPressure(),
  }
}
