import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    allowList: ['127.0.0.1'],
  })
}

export default fp(rateLimitPlugin, { name: 'rate-limit' })
