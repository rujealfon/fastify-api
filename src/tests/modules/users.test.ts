import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAndLogin, resetDb } from '@/tests/fixtures/index.js'

interface Profile {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  bio: string | null
  phoneNumber: string | null
  birthDate: string | null
}

interface User {
  id: string
  email: string
  profile: Profile
  createdAt: string
  updatedAt: string
}

describe('users API', () => {
  let app: FastifyInstance
  let token: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    await resetDb(app)
    token = await registerAndLogin(app)
  })

  afterAll(async () => {
    await app.close()
  })

  // ── helpers ────────────────────────────────────────────────────────────────

  async function createUser(email = 'user@example.com', password = 'password123') {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { email, password },
    })
    return res.json<{ data: User }>().data
  }

  // ── GET /api/v1/users ──────────────────────────────────────────────────────

  describe('gET /api/v1/users', () => {
    it('returns 401 without a token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/users' })
      expect(res.statusCode).toBe(401)
    })

    it('returns an empty list when no users exist', async () => {
      await resetDb(app)
      token = await registerAndLogin(app)
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ data: unknown[], pagination: { page: number, limit: number } }>()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(10)
    })

    it('returns users with correct shape including profile', async () => {
      await createUser('a@example.com')
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ data: User[] }>()
      expect(body.data.length).toBeGreaterThanOrEqual(1)
      const user = body.data[0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('createdAt')
      expect(user).toHaveProperty('updatedAt')
      expect(user).toHaveProperty('profile')
      expect(user).not.toHaveProperty('passwordHash')
      expect(user.profile).toMatchObject({
        firstName: null,
        lastName: null,
        avatarUrl: null,
        bio: null,
        phoneNumber: null,
        birthDate: null,
      })
    })

    it('does not return soft-deleted users', async () => {
      const user = await createUser('gone@example.com')
      await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${token}` },
      })
      const body = res.json<{ data: User[] }>()
      expect(body.data.find(u => u.id === user.id)).toBeUndefined()
    })

    it('paginates with ?page and ?limit', async () => {
      await createUser('p1@example.com')
      await createUser('p2@example.com')
      await createUser('p3@example.com')
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users?page=1&limit=2',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json<{ data: unknown[], pagination: { page: number, limit: number } }>()
      expect(body.data.length).toBeLessThanOrEqual(2)
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(2)
    })
  })

  // ── GET /api/v1/users/:id ──────────────────────────────────────────────────

  describe('gET /api/v1/users/:id', () => {
    it('returns 401 without a token', async () => {
      const user = await createUser()
      const res = await app.inject({ method: 'GET', url: `/api/v1/users/${user.id}` })
      expect(res.statusCode).toBe(401)
    })

    it('returns a user by id with nested profile', async () => {
      const created = await createUser('find@example.com')
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${created.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      const { data } = res.json<{ data: User }>()
      expect(data.id).toBe(created.id)
      expect(data.email).toBe('find@example.com')
      expect(data.profile).toBeDefined()
      expect(data.profile).toMatchObject({
        firstName: null,
        lastName: null,
        avatarUrl: null,
        bio: null,
        phoneNumber: null,
        birthDate: null,
      })
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 for a soft-deleted user', async () => {
      const user = await createUser('deleted@example.com')
      await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 for a non-uuid id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/not-a-uuid',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  // ── POST /api/v1/users ─────────────────────────────────────────────────────

  describe('pOST /api/v1/users', () => {
    it('creates a user and returns 201 with user and empty profile', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'new@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(201)
      const { data } = res.json<{ data: User }>()
      expect(data.id).toBeDefined()
      expect(data.email).toBe('new@example.com')
      expect(data.profile).toMatchObject({
        firstName: null,
        lastName: null,
        avatarUrl: null,
        bio: null,
        phoneNumber: null,
        birthDate: null,
      })
    })

    it('does not expose passwordHash', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'new@example.com', password: 'password123' },
      })
      expect(res.json()).not.toHaveProperty('data.passwordHash')
    })

    it('returns 409 for duplicate email', async () => {
      await createUser('dup@example.com')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'dup@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(409)
    })

    it('allows re-registration after soft-delete', async () => {
      const user = await createUser('reuse@example.com')
      await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'reuse@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('returns 400 for invalid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'bad-email', password: 'password123' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for password shorter than 8 characters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'short@example.com', password: 'abc' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when body is empty', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/users', payload: {} })
      expect(res.statusCode).toBe(400)
    })
  })

  // ── PATCH /api/v1/users/:id ────────────────────────────────────────────────

  describe('pATCH /api/v1/users/:id', () => {
    it('returns 401 without a token', async () => {
      const user = await createUser()
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${user.id}`,
        payload: { email: 'updated@example.com' },
      })
      expect(res.statusCode).toBe(401)
    })

    it('updates email and returns the updated user with profile', async () => {
      const user = await createUser('before@example.com')
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { email: 'after@example.com' },
      })
      expect(res.statusCode).toBe(200)
      const { data } = res.json<{ data: User }>()
      expect(data.email).toBe('after@example.com')
      expect(data.profile).toBeDefined()
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${token}` },
        payload: { email: 'x@example.com' },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 when body is empty', async () => {
      const user = await createUser()
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for invalid email format', async () => {
      const user = await createUser()
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { email: 'not-valid' },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  // ── DELETE /api/v1/users/:id ───────────────────────────────────────────────

  describe('dELETE /api/v1/users/:id', () => {
    it('returns 401 without a token', async () => {
      const user = await createUser()
      const res = await app.inject({ method: 'DELETE', url: `/api/v1/users/${user.id}` })
      expect(res.statusCode).toBe(401)
    })

    it('soft-deletes a user and returns 204', async () => {
      const user = await createUser('todelete@example.com')
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(204)
    })

    it('returns 404 when deleting an already-deleted user', async () => {
      const user = await createUser('twice@example.com')
      await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/${user.id}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/users/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 for a non-uuid id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/users/not-a-uuid',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(400)
    })
  })
})
