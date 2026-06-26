import process from 'node:process'
import { sql as drizzleSql } from 'drizzle-orm'
import { createDb } from './index.js'

const url = process.env.DATABASE_URL
if (!url)
  throw new Error('DATABASE_URL is not set')

async function main() {
  const { db, sql } = createDb(url!)
  const result = await db.execute(drizzleSql`DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '90 days'`)
  process.stdout.write(`[cleanup] purged ${result.count} user(s) soft-deleted >90 days ago\n`)
  await sql.end()
}

main().catch((err) => {
  process.stderr.write(`Cleanup failed: ${(err as Error).message}\n`)
  process.exit(1)
})
