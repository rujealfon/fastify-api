import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  purgeAt: timestamp('purge_at'),
}, t => [
  // Partial index so expired deleted users don't block a new active account.
  uniqueIndex('users_email_unique').on(t.email).where(sql`${t.deletedAt} IS NULL`),
])

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
