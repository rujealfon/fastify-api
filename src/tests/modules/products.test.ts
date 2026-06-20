import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAndLogin, resetDb } from '@/tests/fixtures/index.js'

describe('products API', () => {
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

  it('pOST /api/v1/products creates a product', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Widget', price: 9.99, stock: 100 },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json<{ data: { id: string, name: string } }>()
    expect(body.data.name).toBe('Widget')
    expect(body.data.id).toBeDefined()
  })

  it('gET /api/v1/products returns list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: unknown[] }>()
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('gET /api/v1/products/:id returns 404 for unknown id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(404)
  })

  it('pATCH /api/v1/products/:id updates a product', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Gadget', price: 19.99, stock: 50 },
    })
    const { data: created } = create.json<{ data: { id: string } }>()

    const update = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${created.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { price: 24.99 },
    })
    expect(update.statusCode).toBe(200)
  })

  it('dELETE /api/v1/products/:id deletes a product', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Doohickey', price: 4.99, stock: 10 },
    })
    const { data: created } = create.json<{ data: { id: string } }>()

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${created.id}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(del.statusCode).toBe(204)
  })
})
