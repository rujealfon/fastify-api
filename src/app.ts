import type { FastifyServerOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import envPlugin from '@fastify/env'
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
import compressPlugin from './plugins/compress.js'
import cookiePlugin from './plugins/cookie.js'
import corsPlugin from './plugins/cors.js'
import dbPlugin from './plugins/db.js'
import helmetPlugin from './plugins/helmet.js'
import jwtPlugin from './plugins/jwt.js'
import metricsPlugin from './plugins/metrics.js'
import multipartPlugin from './plugins/multipart.js'
import rateLimitPlugin from './plugins/rate-limit.js'
import redisPlugin from './plugins/redis.js'
import requestContextPlugin from './plugins/request-context.js'
import scalarPlugin from './plugins/scalar.js'
import sensiblePlugin from './plugins/sensible.js'
import underPressurePlugin from './plugins/under-pressure.js'

type TrustProxyConfig = FastifyServerOptions['trustProxy']

const DEFAULT_PRODUCTION_TRUST_PROXY = ['127.0.0.1', '::1']

function loadDotEnvIntoProcess(path = '.env') {
  if (!existsSync(path))
    return

  const content = readFileSync(path, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#'))
      continue

    const assignment = trimmed.startsWith('export ') ? trimmed.slice(7).trimStart() : trimmed
    const separatorIndex = assignment.indexOf('=')
    if (separatorIndex === -1)
      continue

    const key = assignment.slice(0, separatorIndex).trim()
    const rawValue = assignment.slice(separatorIndex + 1).trim()
    if (!/^[\w.-]+$/.test(key))
      continue
    if (process.env[key] !== undefined)
      continue

    let value = rawValue.trim()
    const quote = value[0]
    if ((quote === '"' || quote === '\'') && value.endsWith(quote)) {
      value = value.slice(1, -1)
      if (quote === '"')
        value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    }
    else {
      value = value.replace(/\s+#.*$/, '')
    }

    process.env[key] = value
  }
}

function parseTrustProxy(value = process.env.TRUST_PROXY, nodeEnv = process.env.NODE_ENV): TrustProxyConfig {
  if (value === undefined || value.trim() === '') {
    return nodeEnv === 'production' ? DEFAULT_PRODUCTION_TRUST_PROXY : false
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'true')
    return true

  if (normalized === 'false')
    return false

  const hopCount = Number.parseInt(normalized, 10)
  if (String(hopCount) === normalized && hopCount >= 0)
    return hopCount

  return value
    .split(',')
    .map(proxy => proxy.trim())
    .filter(Boolean)
}

export async function buildApp() {
  loadDotEnvIntoProcess()

  const fastify = Fastify({
    trustProxy: parseTrustProxy(),
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

  // Data layer
  await fastify.register(dbPlugin)
  await fastify.register(redisPlugin)
  await fastify.register(rateLimitPlugin)

  // Core utilities
  await fastify.register(sensiblePlugin)

  // Security & transport
  await fastify.register(helmetPlugin)
  await fastify.register(compressPlugin)
  await fastify.register(corsPlugin)
  await fastify.register(cookiePlugin)

  // Reliability
  await fastify.register(underPressurePlugin)

  // Request lifecycle
  await fastify.register(multipartPlugin)
  await fastify.register(requestContextPlugin)

  // Observability
  await fastify.register(metricsPlugin)

  // Auth
  await fastify.register(jwtPlugin)
  await fastify.register(authDecorator)
  await fastify.register(requestIdHook)

  // API docs
  await fastify.register(scalarPlugin)

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON())
    }
    const err = error as Error & { statusCode?: number, validation?: Array<Record<string, unknown>> }
    if (err.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: err.message || 'Rate limit exceeded',
        },
      })
    }
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
