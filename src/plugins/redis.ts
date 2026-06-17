import type { FastifyPluginAsync } from 'fastify'
import fastifyRedis from '@fastify/redis'
import fp from 'fastify-plugin'

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyRedis, {
    url: fastify.config.REDIS_URL,
    closeClient: true,
    connectTimeout: 5000,
  })
}

export default fp(redisPlugin, { name: 'redis' })
