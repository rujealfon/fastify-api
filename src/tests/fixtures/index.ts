import { eq, sql } from 'drizzle-orm'
import { buildApp } from '@/app.js'
import { ROLES } from '@/common/constants/index.js'
import { users } from '@/db/schema/index.js'

export async function createTestApp() {
  const app = await buildApp()
  await app.ready()
  return app
}

export async function resetDb(app: Awaited<ReturnType<typeof createTestApp>>) {
  await app.db.execute(sql`truncate table products, users, audit_logs restart identity cascade`)
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

export function firstCookieHeader(setCookie: string | string[] | undefined): string {
  return Array.isArray(setCookie) ? setCookie[0] : setCookie ?? ''
}

export function extractTokenFromCookie(setCookie: string | string[] | undefined): string {
  const token = firstCookieHeader(setCookie).split(';')[0].replace(/^token=/, '')
  if (!token)
    throw new Error('token cookie not found in Set-Cookie header')
  return token
}
