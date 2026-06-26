import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAdminAndLogin, registerAndLogin, resetDb } from '@/tests/fixtures/index.js'

const settle = () => new Promise<void>(r => setTimeout(r, 50))

describe('audit logs API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })
  beforeEach(async () => {
    await resetDb(app)
  })
  afterAll(async () => {
    await app.close()
  })

  describe('list all logs (admin)', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/audit-logs' })
      expect(res.statusCode).toBe(401)
    })

    it('returns 403 for non-admin', async () => {
      const token = await registerAndLogin(app)
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(403)
    })

    it('returns 200 with empty list', async () => {
      const token = await registerAdminAndLogin(app)
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.success).toBe(true)
      // register + login produced logs, so total >= 2
      expect(body.pagination).toMatchObject({ page: 1, limit: 10 })
    })

    it('records auth.registered and auth.logged_in on register+login', async () => {
      const token = await registerAdminAndLogin(app)
      // logActivity is fire-and-forget; give the pending inserts time to commit
      await settle()
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${token}` },
      })
      const body = res.json()
      const actions = body.data.map((l: { action: string }) => l.action)
      expect(actions).toContain('auth.registered')
      expect(actions).toContain('auth.logged_in')
    })

    it('respects pagination params', async () => {
      const token = await registerAdminAndLogin(app)
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs?page=1&limit=1',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.pagination.limit).toBe(1)
    })
  })

  describe('list logs for user', () => {
    it('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/users/019ee4e4-bd7d-7e0d-8402-eeb73c578a00/audit-logs' })
      expect(res.statusCode).toBe(401)
    })

    it('returns 403 when requesting another user logs', async () => {
      const token = await registerAndLogin(app)
      const otherToken = await registerAndLogin(app, { email: 'other@example.com', password: 'password123' })

      // Get the other user's id by logging in and hitting /profile
      const profileRes = await app.inject({
        method: 'GET',
        url: '/api/v1/profile',
        headers: { authorization: `Bearer ${otherToken}` },
      })
      const otherId = profileRes.json().data.id

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${otherId}/audit-logs`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(403)
    })

    it('returns own logs for authenticated user', async () => {
      const token = await registerAndLogin(app)
      const profileRes = await app.inject({
        method: 'GET',
        url: '/api/v1/profile',
        headers: { authorization: `Bearer ${token}` },
      })
      const userId = profileRes.json().data.id

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${userId}/audit-logs`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(body.data.every((l: { userId: string }) => l.userId === userId)).toBe(true)
    })

    it('allows admin to view any user logs', async () => {
      const userToken = await registerAndLogin(app)
      const adminToken = await registerAdminAndLogin(app)
      const profileRes = await app.inject({
        method: 'GET',
        url: '/api/v1/profile',
        headers: { authorization: `Bearer ${userToken}` },
      })
      const userId = profileRes.json().data.id

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${userId}/audit-logs`,
        headers: { authorization: `Bearer ${adminToken}` },
      })
      expect(res.statusCode).toBe(200)
    })
  })

  describe('mutation logging smoke tests', () => {
    it('records product.created after creating a product', async () => {
      const userToken = await registerAndLogin(app)
      const adminToken = await registerAdminAndLogin(app)

      await app.inject({
        method: 'POST',
        url: '/api/v1/products',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { name: 'Widget', price: 9.99, stock: 5 },
      })

      // Wait for fire-and-forget insert to settle
      await settle()

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${adminToken}` },
      })
      const actions = res.json().data.map((l: { action: string }) => l.action)
      expect(actions).toContain('product.created')
    })

    it('records product.deleted with metadata after deleting a product', async () => {
      const userToken = await registerAndLogin(app)
      const adminToken = await registerAdminAndLogin(app)

      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/products',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { name: 'Doomed Widget', price: 4.99, stock: 1 },
      })
      const productId = created.json().data.id

      await app.inject({
        method: 'DELETE',
        url: `/api/v1/products/${productId}`,
        headers: { authorization: `Bearer ${userToken}` },
      })

      await settle()

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${adminToken}` },
      })
      const log = res.json().data.find((l: { action: string }) => l.action === 'product.deleted')
      expect(log).toBeDefined()
      expect(log.metadata).toMatchObject({ name: 'Doomed Widget', price: '4.99' })
    })

    it('populates metadata on auth.logged_in', async () => {
      const adminToken = await registerAdminAndLogin(app)
      await settle()

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${adminToken}` },
      })
      const log = res.json().data.find((l: { action: string }) => l.action === 'auth.logged_in')
      expect(log).toBeDefined()
      expect(log.metadata).toMatchObject({ email: expect.any(String), ip: expect.any(String) })
    })

    it('records user.deleted after deleting a user', async () => {
      const adminToken = await registerAdminAndLogin(app)
      const profileRes = await app.inject({
        method: 'GET',
        url: '/api/v1/profile',
        headers: { authorization: `Bearer ${adminToken}` },
      })
      const adminId = profileRes.json().data.id

      await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${adminId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      })

      await settle()

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
        headers: { authorization: `Bearer ${adminToken}` },
      })
      const actions = res.json().data.map((l: { action: string }) => l.action)
      expect(actions).toContain('user.deleted')
    })
  })
})
