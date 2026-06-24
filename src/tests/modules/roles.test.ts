import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAdminAndLogin, registerAndLogin, registerSuperAdminAndLogin, resetDb } from '@/tests/fixtures/index.js'

interface RoleItem {
  id: string
  name: string
  description: string | null
  permissionCount: number
  createdAt: string
  updatedAt: string
}

interface RoleDetail {
  id: string
  name: string
  description: string | null
  permissions: string[]
  createdAt: string
  updatedAt: string
}

describe('roles API', () => {
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

  describe('gET /api/v1/roles', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/roles' })
      expect(res.statusCode).toBe(401)
    })

    it('returns 403 for non-super_admin', async () => {
      const userToken = await registerAndLogin(app)
      const resUser = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${userToken}` } })
      expect(resUser.statusCode).toBe(403)
      const resAdmin = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${adminToken}` } })
      expect(resAdmin.statusCode).toBe(403)
    })

    it('returns seeded roles with pagination', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` } })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ data: RoleItem[], pagination: { total: number } }>()
      expect(body.data.length).toBe(3)
      expect(body.pagination.total).toBe(3)
      expect(body.data[0]).toHaveProperty('permissionCount')
    })
  })

  describe('gET /api/v1/roles/:id', () => {
    it('returns role details with permissions array', async () => {
      const listRes = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` } })
      const { data } = listRes.json<{ data: RoleItem[] }>()
      const adminRole = data.find(r => r.name === 'admin')!

      const res = await app.inject({ method: 'GET', url: `/api/v1/roles/${adminRole.id}`, headers: { authorization: `Bearer ${superToken}` } })
      expect(res.statusCode).toBe(200)
      const detail = res.json<{ data: RoleDetail }>().data
      expect(detail.name).toBe('admin')
      expect(detail.permissions.length).toBeGreaterThan(0)
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/roles/00000000-0000-0000-0000-000000000000', headers: { authorization: `Bearer ${superToken}` } })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('pOST /api/v1/roles', () => {
    it('returns 403 for regular admin', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/roles', headers: { authorization: `Bearer ${adminToken}` }, payload: { name: 'moderator' } })
      expect(res.statusCode).toBe(403)
    })

    it('super_admin creates a role', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` }, payload: { name: 'moderator', description: 'Content moderator' } })
      expect(res.statusCode).toBe(201)
      const detail = res.json<{ data: RoleDetail }>().data
      expect(detail.name).toBe('moderator')
      expect(detail.permissions).toEqual([])
    })

    it('creates a role with initial permissions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/roles',
        headers: { authorization: `Bearer ${superToken}` },
        payload: { name: 'reader', permissions: ['products:read'] },
      })
      expect(res.statusCode).toBe(201)
    })

    it('returns 409 for duplicate role name', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` }, payload: { name: 'moderator' } })
      const res = await app.inject({ method: 'POST', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` }, payload: { name: 'moderator' } })
      expect(res.statusCode).toBe(409)
    })
  })

  describe('pUT /api/v1/roles/:id/permissions', () => {
    it('returns 403 for regular admin', async () => {
      const listRes = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` } })
      const { data } = listRes.json<{ data: RoleItem[] }>()
      const userRole = data.find(r => r.name === 'user')!

      const res = await app.inject({ method: 'PUT', url: `/api/v1/roles/${userRole.id}/permissions`, headers: { authorization: `Bearer ${adminToken}` }, payload: { permissions: ['products:read'] } })
      expect(res.statusCode).toBe(403)
    })

    it('super_admin replaces permissions for a role', async () => {
      const listRes = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` } })
      const { data } = listRes.json<{ data: RoleItem[] }>()
      const userRole = data.find(r => r.name === 'user')!

      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/roles/${userRole.id}/permissions`,
        headers: { authorization: `Bearer ${superToken}` },
        payload: { permissions: ['products:read', 'products:write'] },
      })
      expect(res.statusCode).toBe(200)
      const detail = res.json<{ data: RoleDetail }>().data
      expect(detail.permissions.sort()).toEqual(['products:read', 'products:write'])
    })

    it('returns 404 for unknown role', async () => {
      const res = await app.inject({ method: 'PUT', url: '/api/v1/roles/00000000-0000-0000-0000-000000000000/permissions', headers: { authorization: `Bearer ${superToken}` }, payload: { permissions: [] } })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('dELETE /api/v1/roles/:id', () => {
    it('returns 403 for regular admin', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` }, payload: { name: 'temp_role' } })
      const roleId = res.json<{ data: RoleDetail }>().data.id
      const delRes = await app.inject({ method: 'DELETE', url: `/api/v1/roles/${roleId}`, headers: { authorization: `Bearer ${adminToken}` } })
      expect(delRes.statusCode).toBe(403)
    })

    it('super_admin deletes a role', async () => {
      const createRes = await app.inject({ method: 'POST', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` }, payload: { name: 'temp_role' } })
      const roleId = createRes.json<{ data: RoleDetail }>().data.id
      const res = await app.inject({ method: 'DELETE', url: `/api/v1/roles/${roleId}`, headers: { authorization: `Bearer ${superToken}` } })
      expect(res.statusCode).toBe(204)
    })

    it('returns 409 if users are assigned the role', async () => {
      await registerAndLogin(app)

      const listRes = await app.inject({ method: 'GET', url: '/api/v1/roles', headers: { authorization: `Bearer ${superToken}` } })
      const { data } = listRes.json<{ data: RoleItem[] }>()
      const userRole = data.find(r => r.name === 'user')!

      const res = await app.inject({ method: 'DELETE', url: `/api/v1/roles/${userRole.id}`, headers: { authorization: `Bearer ${superToken}` } })
      expect(res.statusCode).toBe(409)
    })
  })
})
