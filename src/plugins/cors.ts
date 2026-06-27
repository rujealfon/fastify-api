import type { FastifyPluginAsync } from 'fastify'
import cors from '@fastify/cors'
import fp from 'fastify-plugin'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const configuredOrigins = fastify.config.CORS_ORIGINS
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (fastify.config.NODE_ENV === 'production' && configuredOrigins.length === 0)
    throw new Error('CORS_ORIGINS must contain at least one origin in production')

  await fastify.register(cors, {
    origin: fastify.config.NODE_ENV === 'production' ? configuredOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Mobile-API-Key'],
    credentials: true,
  })
}

export default fp(corsPlugin, { name: 'cors' })
