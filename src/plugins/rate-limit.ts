import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import fp from 'fastify-plugin'
import { createValkeyRateLimitStore } from './rate-limit-store.js'

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Skip in dev — hot reloads would exhaust the window constantly.
  if (fastify.config.NODE_ENV === 'development')
    return

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    allowList: ['127.0.0.1'],
    store: createValkeyRateLimitStore(fastify.valkey),
    // x-forwarded-for first so clients behind a reverse proxy are keyed by
    // their real IP, not the proxy's. allowList is the real spoofing defence.
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] as string ?? request.ip
    },
  })
}

export default fp(rateLimitPlugin, { name: 'rate-limit' })
