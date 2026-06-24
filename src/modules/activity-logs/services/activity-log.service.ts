import type { Db } from '@/db/index.js'
import { desc, eq, getTableColumns, sql } from 'drizzle-orm'
import { activityLogs } from '@/db/schema/index.js'

export async function findActivityLogs(db: Db, page: number, limit: number, userId?: string) {
  const where = userId ? eq(activityLogs.userId, userId) : undefined
  const rows = await db
    .select({ ...getTableColumns(activityLogs), total: sql<number>`count(*) over()` })
    .from(activityLogs)
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .offset((page - 1) * limit)
    .limit(limit)
  const total = Number(rows[0]?.total ?? 0)
  return {
    data: rows.map(({ total: _, ...r }) => ({
      ...r,
      metadata: r.metadata as Record<string, unknown> | null,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  }
}
