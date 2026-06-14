import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { createDb, type Db } from '../db/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Db
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const { db, sql } = createDb(fastify.config.DATABASE_URL)
  fastify.decorate('db', db)
  fastify.addHook('onClose', async () => {
    await sql.end()
  })
}

export default fp(dbPlugin, { name: 'db' })
