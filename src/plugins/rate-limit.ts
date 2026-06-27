import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import fp from 'fastify-plugin'

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Skip in dev — hot reloads would exhaust the window constantly.
  if (fastify.config.NODE_ENV === 'development')
    return

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    allowList: ['127.0.0.1'],
    redis: fastify.redis,
    keyGenerator: (request) => {
      return request.ip
    },
  })
}

export default fp(rateLimitPlugin, { name: 'rate-limit' })
