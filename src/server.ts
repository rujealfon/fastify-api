import process from 'node:process'
import { buildApp } from './app.js'

async function start() {
  const app = await buildApp()
  try {
    const address = await app.listen({
      port: app.config.PORT,
      host: app.config.HOST,
    })
    app.log.info(`Server listening at ${address}`)

    const shutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully`)
      await app.close()
      process.exit(0)
    }

    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))
  }
  catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
