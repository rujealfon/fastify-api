import type { FastifyReply, FastifyRequest } from 'fastify'
import { checkDb, checkValkey } from '@/modules/health/services/health.service.js'

export async function liveness(_request: FastifyRequest, _reply: FastifyReply) {
  return { success: true as const, data: { status: 'ok' } }
}

export async function readiness(request: FastifyRequest, reply: FastifyReply) {
  const [dbOk, valkeyOk] = await Promise.all([
    checkDb(request.server.db),
    checkValkey(request.server.valkey),
  ])

  if (!dbOk || !valkeyOk) {
    return reply.status(503).send({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: !dbOk ? 'database unreachable' : 'valkey unreachable',
      },
    })
  }

  return { success: true as const, data: { status: 'ready' } }
}

export async function details(request: FastifyRequest, _reply: FastifyReply) {
  const memory = request.server.memoryUsage()
  return {
    success: true as const,
    data: {
      status: request.server.isUnderPressure() ? 'degraded' : 'ok',
      memory: {
        heapUsed: memory.heapUsed,
        rssBytes: memory.rssBytes,
        eventLoopDelay: memory.eventLoopDelay,
        eventLoopUtilized: memory.eventLoopUtilized,
      },
      underPressure: request.server.isUnderPressure(),
    },
  }
}
