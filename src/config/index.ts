import type { AppConfig } from './schema.js'

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig
  }
}

export type { AppConfig } from './schema.js'
export { configSchema } from './schema.js'
