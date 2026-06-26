import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import process from 'node:process'
import compress from '@fastify/compress'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import envPlugin from '@fastify/env'
import helmet from '@fastify/helmet'
import fastifyJwt from '@fastify/jwt'
import fastifyRedis from '@fastify/redis'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import authDecorator from './common/decorators/auth.js'
import { AppError } from './common/errors/AppError.js'
import requestIdHook from './common/hooks/request-id.js'
import { configSchema } from './config/schema.js'
import auditLogsRoutes from './modules/audit-logs/routes/index.js'
import authRoutes from './modules/auth/routes/index.js'
import healthRoutes from './modules/health/routes/index.js'
import permissionsRoutes from './modules/permissions/routes/index.js'
import productsRoutes from './modules/products/routes/index.js'
import profileRoutes from './modules/profile/routes/index.js'
import rolesRoutes from './modules/roles/routes/index.js'
import usersRoutes from './modules/users/routes/index.js'
import dbPlugin from './plugins/db.js'
import metricsPlugin from './plugins/metrics.js'
import rateLimitPlugin from './plugins/rate-limit.js'
import requestContextPlugin from './plugins/request-context.js'
import scalarPlugin from './plugins/scalar.js'
import underPressurePlugin from './plugins/under-pressure.js'

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

  // Security & transport
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  })
  await fastify.register(compress, {
    global: true,
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024,
  })
  await fastify.register(cors, {
    origin: fastify.config.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  await fastify.register(cookie, {
    secret: fastify.config.COOKIE_SECRET || fastify.config.JWT_SECRET,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  })

  // API docs
  await fastify.register(scalarPlugin)

  // Data layer
  await fastify.register(fastifyRedis, {
    url: fastify.config.REDIS_URL,
  })
  await fastify.register(rateLimitPlugin)
  await fastify.register(dbPlugin)

  // Reliability
  await fastify.register(underPressurePlugin)

  // Request lifecycle
  await fastify.register(requestContextPlugin)

  // Observability
  await fastify.register(metricsPlugin)

  // Auth
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    sign: { expiresIn: '24h' },
    cookie: { cookieName: 'token', signed: false },
  })
  await fastify.register(authDecorator)
  await fastify.register(requestIdHook)

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON())
    }
    const err = error as Error & { validation?: Array<Record<string, unknown>> }
    if (err.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          fields: err.validation.map((issue) => {
            const path = Array.isArray(issue.path)
              ? (issue.path as (string | number)[])
              : (issue.instancePath as string | undefined ?? '').replace(/^\//, '').split('/').filter(Boolean)
            return {
              path,
              code: (issue.keyword as string | undefined) ?? 'invalid',
              message: (issue.message as string | undefined) ?? 'Invalid value',
            }
          }),
        },
      })
    }
    request.log.error({ err }, 'unhandled error')
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    })
  })

  // Routes
  await fastify.register(healthRoutes, { prefix: '/health' })
  await fastify.register(authRoutes)
  await fastify.register(profileRoutes)
  await fastify.register(usersRoutes)
  await fastify.register(productsRoutes)
  await fastify.register(rolesRoutes)
  await fastify.register(permissionsRoutes)
  await fastify.register(auditLogsRoutes)

  return fastify
}
