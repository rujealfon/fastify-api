import type { FastifyPluginAsync } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    sign: { expiresIn: '15m' },
    cookie: { cookieName: 'token', signed: true },
  })
}

export default fp(jwtPlugin, { name: 'jwt' })
