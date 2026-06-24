import { eq, sql } from 'drizzle-orm'
import { buildApp } from '@/app.js'
import { PERMISSIONS, ROLES } from '@/common/constants/index.js'
import { permissions, rolePermissions, roles, users } from '@/db/schema/index.js'

export async function createTestApp() {
  const app = await buildApp()
  await app.ready()
  return app
}

async function seedRoles(app: Awaited<ReturnType<typeof createTestApp>>) {
  const roleRows = await app.db
    .insert(roles)
    .values([
      { name: ROLES.USER, description: 'Default user role' },
      { name: ROLES.ADMIN, description: 'Administrator role' },
      { name: ROLES.SUPER_ADMIN, description: 'Super administrator role' },
    ])
    .returning()

  const permRows = await app.db
    .insert(permissions)
    .values(Object.values(PERMISSIONS).map(key => ({ key })))
    .returning()

  const adminRole = roleRows.find(r => r.name === ROLES.ADMIN)!
  const superAdminRole = roleRows.find(r => r.name === ROLES.SUPER_ADMIN)!
  const userRole = roleRows.find(r => r.name === ROLES.USER)!
  const adminPermKeys = new Set<string>(Object.values(PERMISSIONS).filter(k => k !== PERMISSIONS.ROLES_MANAGE))
  const userPermKeys = new Set<string>([PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE, PERMISSIONS.PROFILE_MANAGE])

  await app.db.insert(rolePermissions).values([
    ...permRows.filter(p => adminPermKeys.has(p.key)).map(p => ({ roleId: adminRole.id, permissionId: p.id })),
    ...permRows.map(p => ({ roleId: superAdminRole.id, permissionId: p.id })),
    ...permRows.filter(p => userPermKeys.has(p.key)).map(p => ({ roleId: userRole.id, permissionId: p.id })),
  ])
}

export async function resetDb(app: Awaited<ReturnType<typeof createTestApp>>) {
  await app.db.execute(sql`truncate table role_permissions, permissions, roles, products, users, activity_logs restart identity cascade`)
  await seedRoles(app)
}

export async function registerAndLogin(
  app: Awaited<ReturnType<typeof createTestApp>>,
  user = { email: 'test@example.com', password: 'password123' },
) {
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: user,
  })
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: user.email, password: user.password },
  })
  return extractTokenFromCookie(res.headers['set-cookie'])
}

export async function registerAdminAndLogin(
  app: Awaited<ReturnType<typeof createTestApp>>,
  user = { email: 'admin@example.com', password: 'password123' },
) {
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: user })
  await app.db.update(users).set({ role: ROLES.ADMIN }).where(eq(users.email, user.email))
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: user.email, password: user.password },
  })
  return extractTokenFromCookie(res.headers['set-cookie'])
}

export async function registerSuperAdminAndLogin(
  app: Awaited<ReturnType<typeof createTestApp>>,
  user = { email: 'superadmin@example.com', password: 'password123' },
) {
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: user })
  await app.db.update(users).set({ role: ROLES.SUPER_ADMIN }).where(eq(users.email, user.email))
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: user.email, password: user.password },
  })
  return extractTokenFromCookie(res.headers['set-cookie'])
}

export function firstCookieHeader(setCookie: string | string[] | undefined): string {
  return Array.isArray(setCookie) ? setCookie[0] : setCookie ?? ''
}

export function extractTokenFromCookie(setCookie: string | string[] | undefined): string {
  const token = firstCookieHeader(setCookie).split(';')[0].replace(/^token=/, '')
  if (!token)
    throw new Error('token cookie not found in Set-Cookie header')
  return token
}
