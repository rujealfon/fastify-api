import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAndLogin, resetDb } from '@/tests/fixtures/index.js'

describe('users API', () => {
  let app: FastifyInstance
  let token: string

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDb(app)
    token = await registerAndLogin(app)
  })

  it('gET /api/v1/users requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/users' })
    expect(res.statusCode).toBe(401)
  })

  it('gET /api/v1/users returns list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: unknown[], meta: { page: number } }>()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta.page).toBe(1)
  })

  it('pOST /api/v1/users creates a user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { name: 'New User', email: 'new@example.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json<{ data: { id: string, name: string } }>()
    expect(body.data.name).toBe('New User')
  })

  it('gET /api/v1/users/:id returns 404 for unknown id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(404)
  })

  it('pATCH /api/v1/users/:id updates a user', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { name: 'Old Name', email: 'old@example.com', password: 'password123' },
    })
    const { data: created } = create.json<{ data: { id: string } }>()

    const update = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${created.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'New Name' },
    })
    expect(update.statusCode).toBe(200)
    expect(update.json<{ data: { name: string } }>().data.name).toBe('New Name')
  })

  it('dELETE /api/v1/users/:id deletes a user', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      payload: { name: 'To Delete', email: 'delete@example.com', password: 'password123' },
    })
    const { data: created } = create.json<{ data: { id: string } }>()

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${created.id}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(del.statusCode).toBe(204)
  })
})
