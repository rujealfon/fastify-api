import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import fp from 'fastify-plugin'

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Skip only in test — rate limits would break integration tests that hit
  // auth endpoints many times and use real Redis with shared counters.
  if (fastify.config.NODE_ENV === 'test')
    return

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    allowList: ['127.0.0.1'],
    redis: fastify.redis,
    // Parse the leftmost entry from x-forwarded-for so clients behind a trusted
    // reverse proxy are keyed by their real IP. Do not trust the full header
    // string as a key — a single client can send multiple IPs in the chain.
    keyGenerator: (request) => {
      const xff = request.headers['x-forwarded-for']
      const raw = Array.isArray(xff) ? xff[0] : xff
      return raw?.split(',')[0]?.trim() ?? request.ip
    },
  })
}

export default fp(rateLimitPlugin, { name: 'rate-limit' })
