import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAdminAndLogin, registerAndLogin, resetDb } from '@/tests/fixtures/index.js'

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

  it('keeps liveness public', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' })
    expect(res.statusCode).toBe(200)
  })

  it('requires authentication for operational details', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/details' })
    expect(res.statusCode).toBe(401)
  })

  it('requires elevated permission for operational details', async () => {
    const userToken = await registerAndLogin(app, { email: 'health-user@example.com', password: 'password123' })
    const res = await app.inject({ method: 'GET', url: '/health/details', headers: { authorization: `Bearer ${userToken}` } })
    expect(res.statusCode).toBe(403)
  })

  it('allows an admin to view operational details', async () => {
    const adminToken = await registerAdminAndLogin(app, { email: 'health-admin@example.com', password: 'password123' })
    const res = await app.inject({ method: 'GET', url: '/health/details', headers: { authorization: `Bearer ${adminToken}` } })
    expect(res.statusCode).toBe(200)
  })
})
