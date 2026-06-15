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
      summary: 'Readiness probe (checks DB connectivity)',
      response: {
        200: z.object({ status: z.string() }),
        503: z.object({ status: z.string(), reason: z.string() }),
      },
    },
    handler: controller.readiness,
  })
}

export default healthRoutes
