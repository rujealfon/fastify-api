import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, resetDb } from '@/tests/fixtures/index.js'

describe('auth API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDb(app)
  })

  it('pOST /api/v1/auth/register creates a user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Alice', email: 'alice@example.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json<{ data: { id: string, email: string } }>()
    expect(body.data.email).toBe('alice@example.com')
    expect(body.data.id).toBeDefined()
  })

  it('pOST /api/v1/auth/register rejects duplicate email', async () => {
    const payload = { name: 'Bob', email: 'bob@example.com', password: 'password123' }
    await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })
    expect(res.statusCode).toBe(409)
  })

  it('pOST /api/v1/auth/register rejects weak password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Charlie', email: 'charlie@example.com', password: 'short' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('pOST /api/v1/auth/login returns a token', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Dave', email: 'dave@example.com', password: 'password123' },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'dave@example.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: { token: string } }>()
    expect(body.data.token).toBeDefined()
  })

  it('pOST /api/v1/auth/login rejects wrong password', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { name: 'Eve', email: 'eve@example.com', password: 'password123' },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'eve@example.com', password: 'wrongpassword' },
    })
    expect(res.statusCode).toBe(401)
  })
})
