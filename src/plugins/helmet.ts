import type { FastifyPluginAsync } from 'fastify'
import helmet from '@fastify/helmet'
import fp from 'fastify-plugin'

const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  })
}

export default fp(helmetPlugin, { name: 'helmet' })
