import type { Db } from '@/db/index.js'
import type { NewActivityLogRow } from '@/db/schema/index.js'
import { activityLogs } from '@/db/schema/index.js'

// ponytail: fire-and-forget — logging must never break the request path
export function logActivity(db: Db, data: NewActivityLogRow): void {
  db.insert(activityLogs).values(data).catch(() => {})
}
