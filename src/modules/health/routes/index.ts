import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { apiErrorSchema, apiSuccessSchema } from '@/common/schemas/index.js'
import { checkDb, checkRedis } from '@/modules/health/services/health.service.js'

const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/live', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness probe',
      response: {
        200: apiSuccessSchema(z.object({ status: z.string() })),
      },
    },
    handler: async () => ({ success: true as const, data: { status: 'ok' } }),
  })

  fastify.get('/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness probe (checks DB + Redis connectivity)',
      response: {
        200: apiSuccessSchema(z.object({ status: z.string() })),
        503: apiErrorSchema,
      },
    },
    handler: async (request, reply) => {
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
    },
  })

  fastify.get('/details', {
    schema: {
      tags: ['Health'],
      summary: 'System details — memory, event loop, pressure status',
      response: {
        200: apiSuccessSchema(z.object({
          status: z.string(),
          memory: z.object({
            heapUsed: z.number(),
            rssBytes: z.number(),
            eventLoopDelay: z.number(),
            eventLoopUtilized: z.number(),
          }),
          underPressure: z.boolean(),
        })),
      },
    },
    handler: async (request) => {
      const memory = request.server.memoryUsage()
      const underPressure = request.server.isUnderPressure()
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
    },
  })
}

export default healthRoutes
