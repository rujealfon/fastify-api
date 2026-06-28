import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import fp from 'fastify-plugin'

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Keep local development and integration tests unthrottled. Production uses
  // Redis-backed limits so counters are shared across app instances.
  if (fastify.config.NODE_ENV !== 'production')
    return

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
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
