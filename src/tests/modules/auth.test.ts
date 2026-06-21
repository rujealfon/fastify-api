import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, resetDb } from '@/tests/fixtures/index.js'

describe('auth API', () => {
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

  async function registerLoginAndDelete(email: string) {
    const registerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password: 'password123' },
    })
    const userId = registerRes.json<{ data: { id: string } }>().data.id
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: 'password123' },
    })
    const token = loginRes.json<{ data: { token: string } }>().data.token
    await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${token}` },
    })
  }

  // ── POST /api/v1/auth/register ─────────────────────────────────────────────

  describe('pOST /api/v1/auth/register', () => {
    it('creates a user and returns id + email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'alice@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(201)
      const { data } = res.json<{ data: { id: string, email: string } }>()
      expect(data.id).toBeDefined()
      expect(data.email).toBe('alice@example.com')
    })

    it('does not return passwordHash in the response', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'alice@example.com', password: 'password123' },
      })
      expect(res.json()).not.toHaveProperty('data.passwordHash')
    })

    it('returns 409 for duplicate email', async () => {
      const payload = { email: 'bob@example.com', password: 'password123' }
      await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })
      expect(res.statusCode).toBe(409)
    })

    it('returns 409 for a deleted account still within retention', async () => {
      const email = 'recover@example.com'
      await registerLoginAndDelete(email)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email, password: 'password123' },
      })
      expect(res.statusCode).toBe(409)
      expect(res.json<{ error: { message: string } }>().error.message).toContain('Restore')
    })

    it('creates a new account after retention has expired', async () => {
      const email = 'expired@example.com'
      await registerLoginAndDelete(email)
      await app.db.execute(sql`
        update users
        set deleted_at = now() - interval '91 days',
            purge_at = now() - interval '1 day'
        where email = ${email}
      `)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email, password: 'password123' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('returns 400 for password shorter than 8 characters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'charlie@example.com', password: 'short' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for invalid email format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'not-an-email', password: 'password123' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when email is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { password: 'password123' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when password is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'alice@example.com' },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  // ── POST /api/v1/auth/login ────────────────────────────────────────────────

  describe('pOST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'dave@example.com', password: 'password123' },
      })
    })

    it('returns a JWT token on valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'dave@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(200)
      const { data } = res.json<{ data: { token: string } }>()
      expect(typeof data.token).toBe('string')
      expect(data.token.length).toBeGreaterThan(0)
    })

    it('returns 401 for wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'dave@example.com', password: 'wrongpassword' },
      })
      expect(res.statusCode).toBe(401)
    })

    it('returns 401 for unknown email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'ghost@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(401)
    })

    it('returns 400 when body is empty', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {},
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 401 for a soft-deleted user', async () => {
      await registerLoginAndDelete('gone@example.com')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'gone@example.com', password: 'password123' },
      })
      expect(res.statusCode).toBe(401)
    })
  })
})
