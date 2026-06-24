import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAdminAndLogin, registerAndLogin, registerSuperAdminAndLogin, resetDb } from '@/tests/fixtures/index.js'

interface PermissionItem {
  id: string
  key: string
  description: string | null
  createdAt: string
}

describe('permissions API', () => {
  let app: FastifyInstance
  let adminToken: string
  let superToken: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    await resetDb(app)
    adminToken = await registerAdminAndLogin(app)
    superToken = await registerSuperAdminAndLogin(app)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('gET /api/v1/permissions', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/permissions' })
      expect(res.statusCode).toBe(401)
    })

    it('returns 403 for non-super_admin', async () => {
      const userToken = await registerAndLogin(app)
      const resUser = await app.inject({ method: 'GET', url: '/api/v1/permissions', headers: { authorization: `Bearer ${userToken}` } })
      expect(resUser.statusCode).toBe(403)
      const resAdmin = await app.inject({ method: 'GET', url: '/api/v1/permissions', headers: { authorization: `Bearer ${adminToken}` } })
      expect(resAdmin.statusCode).toBe(403)
    })

    it('returns seeded permissions', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/permissions', headers: { authorization: `Bearer ${superToken}` } })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ data: PermissionItem[], pagination: { total: number } }>()
      expect(body.pagination.total).toBe(9)
      expect(body.data[0]).toHaveProperty('key')
    })
  })

  describe('pOST /api/v1/permissions', () => {
    it('returns 403 for regular admin', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/permissions', headers: { authorization: `Bearer ${adminToken}` }, payload: { key: 'reports:read' } })
      expect(res.statusCode).toBe(403)
    })

    it('super_admin creates a permission', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/permissions', headers: { authorization: `Bearer ${superToken}` }, payload: { key: 'reports:read', description: 'Read reports' } })
      expect(res.statusCode).toBe(201)
      const perm = res.json<{ data: PermissionItem }>().data
      expect(perm.key).toBe('reports:read')
    })

    it('returns 409 for duplicate key', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/permissions', headers: { authorization: `Bearer ${superToken}` }, payload: { key: 'reports:read' } })
      const res = await app.inject({ method: 'POST', url: '/api/v1/permissions', headers: { authorization: `Bearer ${superToken}` }, payload: { key: 'reports:read' } })
      expect(res.statusCode).toBe(409)
    })
  })
})
