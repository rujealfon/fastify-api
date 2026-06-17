export interface AppConfig {
  PORT: number
  HOST: string
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  JWT_SECRET: string
  LOG_LEVEL: string
  REDIS_URL: string
  COOKIE_SECRET: string
  OTEL_ENDPOINT: string
}

export const configSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'],
  properties: {
    PORT: { type: 'integer', default: 3000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    DATABASE_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    LOG_LEVEL: { type: 'string', default: 'info' },
    REDIS_URL: { type: 'string' },
    COOKIE_SECRET: { type: 'string', default: '' },
    OTEL_ENDPOINT: { type: 'string', default: '' },
  },
} as const
