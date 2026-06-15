import type { Db } from '@/db/index.js'
import { sql } from 'drizzle-orm'

export async function checkDb(db: Db): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`)
    return true
  } catch {
    return false
  }
}
