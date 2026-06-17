import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import * as controller from '@/modules/health/controllers/health.controller.js'

const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/live', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness probe',
      response: { 200: z.object({ status: z.string() }) },
    },
    handler: controller.liveness,
  })

  fastify.get('/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness probe (checks DB + Redis connectivity)',
      response: {
        200: z.object({ status: z.string() }),
        503: z.object({ status: z.string(), reason: z.string() }),
      },
    },
    handler: controller.readiness,
  })

  fastify.get('/details', {
    schema: {
      tags: ['Health'],
      summary: 'System details — memory, event loop, pressure status',
      response: {
        200: z.object({
          status: z.string(),
          memory: z.object({
            heapUsed: z.number(),
            rssBytes: z.number(),
            eventLoopDelay: z.number(),
            eventLoopUtilized: z.number(),
          }),
          underPressure: z.boolean(),
        }),
      },
    },
    handler: controller.details,
  })
}

export default healthRoutes
