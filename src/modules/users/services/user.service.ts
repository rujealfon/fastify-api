import type { Db } from '@/db/index.js'
import type { CreateUserBody, UpdateUserBody } from '@/modules/users/schemas/index.js'
import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { PG_UNIQUE_VIOLATION } from '@/common/constants/index.js'
import { ConflictError } from '@/common/errors/ConflictError.js'
import { NotFoundError } from '@/common/errors/NotFoundError.js'
import { profiles, users } from '@/db/schema/index.js'

const userColumns = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const

const profileColumns = {
  firstName: true,
  lastName: true,
  avatarUrl: true,
  bio: true,
  phoneNumber: true,
  birthDate: true,
} as const

interface UserRow {
  id: string
  email: string
  createdAt: Date
  updatedAt: Date
  profile: {
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    bio: string | null
    phoneNumber: string | null
    birthDate: string | null
  } | null
}

function toUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    profile: row.profile ?? {
      firstName: null,
      lastName: null,
      avatarUrl: null,
      bio: null,
      phoneNumber: null,
      birthDate: null,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function findAllUsers(db: Db, page: number, limit: number) {
  const rows = await db.query.users.findMany({
    columns: userColumns,
    with: { profile: { columns: profileColumns } },
    where: isNull(users.deletedAt),
    offset: (page - 1) * limit,
    limit,
  })
  return rows.map(toUser)
}

export async function findUserById(db: Db, id: string) {
  const row = await db.query.users.findFirst({
    columns: userColumns,
    with: { profile: { columns: profileColumns } },
    where: and(eq(users.id, id), isNull(users.deletedAt)),
  })
  if (!row)
    throw new NotFoundError('User', id)
  return toUser(row)
}

export async function createUser(db: Db, body: CreateUserBody) {
  const existing = await db.query.users.findFirst({ where: and(eq(users.email, body.email), isNull(users.deletedAt)) })
  if (existing)
    throw new ConflictError(`Email '${body.email}' is already registered`)

  const passwordHash = await bcrypt.hash(body.password, 12)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(users)
      .values({ email: body.email, passwordHash })
      .returning({ id: users.id, email: users.email, createdAt: users.createdAt, updatedAt: users.updatedAt })

    await tx.insert(profiles).values({ userId: row.id })

    return toUser({ ...row, profile: null })
  })
}

export async function updateUser(db: Db, id: string, body: UpdateUserBody) {
  await findUserById(db, id)

  try {
    await db.transaction(async (tx) => {
      if (body.email !== undefined) {
        await tx.update(users).set({ email: body.email }).where(eq(users.id, id))
      }
      if (body.profile !== undefined) {
        await tx.update(profiles).set(body.profile).where(eq(profiles.userId, id))
      }
    })
  }
  catch (err) {
    const pgCode = (err as { cause?: { code?: string } })?.cause?.code
    if (pgCode === PG_UNIQUE_VIOLATION)
      throw new ConflictError(`Email '${body.email}' is already registered`)
    throw err
  }

  return findUserById(db, id)
}

export async function deleteUser(db: Db, id: string, deletedBy?: string) {
  await findUserById(db, id)
  await db.update(users).set({ deletedAt: new Date(), deletedBy: deletedBy ?? null }).where(eq(users.id, id))
}
