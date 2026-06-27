import type { FastifyReply, FastifyRequest } from 'fastify'
import process from 'node:process'
import { checkDb, checkRedis } from '@/modules/health/services/health.service.js'

export async function liveness(_request: FastifyRequest, _reply: FastifyReply) {
  return { success: true as const, data: { status: 'ok' } }
}

export async function readiness(request: FastifyRequest, reply: FastifyReply) {
  const [dbOk, redisOk] = await Promise.all([
    checkDb(request.server.db),
    checkRedis(request.server.redis),
  ])

  if (!dbOk || !redisOk) {
    return reply.status(503).send({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: !dbOk ? 'database unreachable' : 'redis unreachable',
      },
    })
  }

  return { success: true as const, data: { status: 'ready' } }
}

export async function details(request: FastifyRequest, _reply: FastifyReply) {
  const processMemory = process.memoryUsage()
  const memory = typeof request.server.memoryUsage === 'function'
    ? request.server.memoryUsage()
    : {
        heapUsed: processMemory.heapUsed,
        rssBytes: processMemory.rss,
        eventLoopDelay: 0,
        eventLoopUtilized: 0,
      }
  const underPressure = typeof request.server.isUnderPressure === 'function'
    ? request.server.isUnderPressure()
    : false

  return {
    success: true as const,
    data: {
      status: underPressure ? 'degraded' : 'ok',
      memory: {
        heapUsed: memory.heapUsed,
        rssBytes: memory.rssBytes,
        eventLoopDelay: memory.eventLoopDelay,
        eventLoopUtilized: memory.eventLoopUtilized,
      },
      underPressure,
    },
  }
}
