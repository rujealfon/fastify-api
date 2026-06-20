import type { FastifyPluginAsync } from 'fastify'
import cookie from '@fastify/cookie'
import fp from 'fastify-plugin'

const cookiePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cookie, {
    secret: fastify.config.COOKIE_SECRET || fastify.config.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  })
}

export default fp(cookiePlugin, { name: 'cookie' })
