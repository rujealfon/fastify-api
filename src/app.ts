import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import process from 'node:process'
import envPlugin from '@fastify/env'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import authDecorator from './common/decorators/auth.js'
import { AppError } from './common/errors/AppError.js'
import requestIdHook from './common/hooks/request-id.js'
import { configSchema } from './config/index.js'
import authRoutes from './modules/auth/routes/index.js'
import healthRoutes from './modules/health/routes/index.js'
import productsRoutes from './modules/products/routes/index.js'
import usersRoutes from './modules/users/routes/index.js'
import corsPlugin from './plugins/cors.js'
import dbPlugin from './plugins/db.js'
import helmetPlugin from './plugins/helmet.js'
import jwtPlugin from './plugins/jwt.js'
import rateLimitPlugin from './plugins/rate-limit.js'
import scalarPlugin from './plugins/scalar.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>()

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // Config — must be first
  await fastify.register(envPlugin, {
    confKey: 'config',
    schema: configSchema,
    dotenv: true,
  })

  // Infrastructure
  await fastify.register(helmetPlugin)
  await fastify.register(scalarPlugin)
  await fastify.register(corsPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(dbPlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(authDecorator)
  await fastify.register(requestIdHook)

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON())
    }
    const err = error as Error & { validation?: unknown }
    if (err.validation) {
      return reply.status(400).send({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: err.message,
      })
    }
    request.log.error({ err }, 'unhandled error')
    return reply.status(500).send({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    })
  })

  // Routes
  await fastify.register(healthRoutes, { prefix: '/health' })
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' })
  await fastify.register(productsRoutes, { prefix: '/api/v1/products' })

  return fastify
}
