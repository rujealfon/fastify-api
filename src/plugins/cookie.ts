import type { FastifyPluginAsync } from 'fastify'
import cookie from '@fastify/cookie'
import fp from 'fastify-plugin'

const cookiePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cookie, {
    // Falls back to JWT_SECRET so the app works without a separate COOKIE_SECRET.
    // Set COOKIE_SECRET in prod to isolate cookie signing from JWT signing.
    secret: fastify.config.COOKIE_SECRET || fastify.config.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  })
}

export default fp(cookiePlugin, { name: 'cookie' })
