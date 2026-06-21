/** Postgres error codes — https://www.postgresql.org/docs/current/errcodes-appendix.html */
export const PG_UNIQUE_VIOLATION = '23505'

/** User roles for access control. */
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const
