import { relations } from 'drizzle-orm'
import { permissions } from './permissions.js'
import { profiles } from './profiles.js'
import { rolePermissions } from './role-permissions.js'
import { roles } from './roles.js'
import { users } from './users.js'

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}))

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}))
