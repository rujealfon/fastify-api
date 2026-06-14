import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import fastifyJwt from '@fastify/jwt'

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    sign: { expiresIn: '24h' },
  })
}

export default fp(jwtPlugin, { name: 'jwt' })
