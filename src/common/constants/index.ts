/** Postgres error codes — https://www.postgresql.org/docs/current/errcodes-appendix.html */
export const PG_UNIQUE_VIOLATION = '23505'

/** User roles for access control. */
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

/** Allowed origins for the mobile login endpoint. */
export const MOBILE_ORIGINS: readonly string[] = ['capacitor://localhost', 'http://localhost']

/** Granular permission keys for route-level access control. */
export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin:access',
  ROLES_MANAGE: 'roles:manage',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_ROLE_ASSIGN: 'users:role_assign',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  ACTIVITY_LOGS_READ: 'activity-logs:read',
  PROFILE_MANAGE: 'profile:manage',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
