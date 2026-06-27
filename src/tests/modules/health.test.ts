import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAdminAndLogin, registerAndLogin, registerSuperAdminAndLogin, resetDb } from '@/tests/fixtures/index.js'

describe('health API', () => {
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

  describe('get /health/live', () => {
    it('returns 200 without authentication', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/live' })
      expect(res.statusCode).toBe(200)
    })
  })

  describe('get /health/details', () => {
    it('returns 401 without a token', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/details' })
      expect(res.statusCode).toBe(401)
    })

    it('returns 403 for regular user role', async () => {
      const token = await registerAndLogin(app, { email: 'user@example.com', password: 'Password123' })
      const res = await app.inject({
        method: 'GET',
        url: '/health/details',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(403)
    })

    it('returns 200 for admin role', async () => {
      const token = await registerAdminAndLogin(app)
      const res = await app.inject({
        method: 'GET',
        url: '/health/details',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
    })

    it('returns 200 for super-admin role', async () => {
      const token = await registerSuperAdminAndLogin(app)
      const res = await app.inject({
        method: 'GET',
        url: '/health/details',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
    })
  })
})
