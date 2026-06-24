import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})

export type RoleRow = typeof roles.$inferSelect
export type NewRoleRow = typeof roles.$inferInsert
