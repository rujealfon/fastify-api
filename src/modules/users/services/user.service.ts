import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import { users } from '@/db/schema/index.js'
import { NotFoundError } from '@/common/errors/NotFoundError.js'
import { ConflictError } from '@/common/errors/ConflictError.js'
import type { CreateUserBody, UpdateUserBody } from '@/modules/users/schemas/index.js'

const userColumns = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const

function toUser(row: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
}

export async function findAllUsers(db: Db, page: number, limit: number) {
  const rows = await db.query.users.findMany({
    columns: userColumns,
    offset: (page - 1) * limit,
    limit,
  })
  return rows.map(toUser)
}

export async function findUserById(db: Db, id: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: userColumns,
  })
  if (!row) throw new NotFoundError('User', id)
  return toUser(row)
}

export async function createUser(db: Db, body: CreateUserBody) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) })
  if (existing) throw new ConflictError(`Email '${body.email}' is already registered`)

  const passwordHash = await bcrypt.hash(body.password, 12)
  const [row] = await db
    .insert(users)
    .values({ name: body.name, email: body.email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, updatedAt: users.updatedAt })

  return toUser(row)
}

export async function updateUser(db: Db, id: string, body: UpdateUserBody) {
  await findUserById(db, id)
  const [row] = await db
    .update(users)
    .set({ ...(body.name && { name: body.name }), ...(body.email && { email: body.email }) })
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, updatedAt: users.updatedAt })

  return toUser(row)
}

export async function deleteUser(db: Db, id: string) {
  await findUserById(db, id)
  await db.delete(users).where(eq(users.id, id))
}
