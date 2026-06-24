import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  key: text('key').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PermissionRow = typeof permissions.$inferSelect
export type NewPermissionRow = typeof permissions.$inferInsert
