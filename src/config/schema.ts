export interface AppConfig {
  PORT: number
  HOST: string
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  JWT_SECRET: string
  LOG_LEVEL: string
}

export const configSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET'],
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
  },
} as const
