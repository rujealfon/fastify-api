import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { permissions } from './permissions.js'
import { roles } from './roles.js'

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.roleId, t.permissionId] })])

export type RolePermissionRow = typeof rolePermissions.$inferSelect
