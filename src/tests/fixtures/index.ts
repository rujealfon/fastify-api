import { buildApp } from '../../app.js'

export async function createTestApp() {
  const app = await buildApp()
  await app.ready()
  return app
}

export async function registerAndLogin(
  app: Awaited<ReturnType<typeof createTestApp>>,
  user = { name: 'Test User', email: 'test@example.com', password: 'password123' },
) {
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: user,
  })
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: user.email, password: user.password },
  })
  const { data } = res.json<{ data: { token: string } }>()
  return data.token
}
