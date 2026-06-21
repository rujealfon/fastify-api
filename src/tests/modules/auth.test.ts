import type { FastifyInstance } from 'fastify'
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
  })

  // ── Account retention: reactivation within the 90-day window ────────────────

  describe('account reactivation', () => {
    const register = (email: string, password: string) =>
      app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email, password } })
    const login = (email: string, password: string) =>
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } })

    // Register, then soft-delete the account. Returns the created id.
    async function registerThenDelete(email: string) {
      const { data: created } = (await register(email, 'password123')).json<{ data: { id: string } }>()
      const { data: auth } = (await login(email, 'password123')).json<{ data: { token: string } }>()
      await app.inject({ method: 'DELETE', url: `/api/v1/users/${created.id}`, headers: { authorization: `Bearer ${auth.token}` } })
      return created.id
    }

    it('reactivates the same account on re-register with the correct password', async () => {
      const id = await registerThenDelete('erin@example.com')

      const again = await register('erin@example.com', 'password123')
      expect(again.statusCode).toBe(201)
      expect(again.json<{ data: { id: string } }>().data.id).toBe(id)
      expect((await login('erin@example.com', 'password123')).statusCode).toBe(200)
    })

    it('restores the account\'s profile data on reactivation', async () => {
      const email = 'iris@example.com'
      const { data: created } = (await register(email, 'password123')).json<{ data: { id: string } }>()
      const { data: auth } = (await login(email, 'password123')).json<{ data: { token: string } }>()
      const headers = { authorization: `Bearer ${auth.token}` }

      // set some profile data, then self-delete
      await app.inject({ method: 'PATCH', url: `/api/v1/users/${created.id}`, headers, payload: { profile: { firstName: 'Iris' } } })
      await app.inject({ method: 'DELETE', url: `/api/v1/users/${created.id}`, headers })

      // reactivate, then confirm the profile data survived
      await register(email, 'password123')
      const { data: auth2 } = (await login(email, 'password123')).json<{ data: { token: string } }>()
      const me = await app.inject({ method: 'GET', url: '/api/v1/profile', headers: { authorization: `Bearer ${auth2.token}` } })
      expect(me.statusCode).toBe(200)
      expect(me.json<{ data: { profile: { firstName: string | null } } }>().data.profile.firstName).toBe('Iris')
    })

    it('creates a new account when re-registering with a wrong password', async () => {
      const id = await registerThenDelete('frank@example.com')

      const again = await register('frank@example.com', 'differentpw')
      expect(again.statusCode).toBe(201)
      expect(again.json<{ data: { id: string } }>().data.id).not.toBe(id)
    })

    it('does not let a soft-deleted account log in', async () => {
      await registerThenDelete('grace@example.com')
      expect((await login('grace@example.com', 'password123')).statusCode).toBe(401)
    })

    it('returns 409 (not 500) when a deleted and an active row share the email', async () => {
      const email = 'henry@example.com'
      // delete the original, then fork a new active account with a different password
      await registerThenDelete(email)
      expect((await register(email, 'differentpw')).statusCode).toBe(201)
      // a deleted row + an active row now share the email; a third register must
      // see the active row and conflict cleanly, never hit the unique index
      expect((await register(email, 'password123')).statusCode).toBe(409)
    })
  })
})
