import type { Db } from '@/db/index.js'
import type { CreateUserBody, UpdateUserBody } from '@/modules/users/schemas/index.js'
import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { ACCOUNT_RETENTION_DAYS_DEFAULT } from '@/common/constants.js'
import { ConflictError } from '@/common/errors/ConflictError.js'
import { NotFoundError } from '@/common/errors/NotFoundError.js'
import { profiles, users } from '@/db/schema/index.js'

const PG_UNIQUE_VIOLATION = '23505'

export function rethrowEmailConflict(err: unknown, email: string): never {
  const pgCode = (err as { code?: string, cause?: { code?: string } }).code
    ?? (err as { cause?: { code?: string } }).cause?.code
  if (pgCode === PG_UNIQUE_VIOLATION)
    throw new ConflictError(`Email '${email}' is already registered`)
  throw err
}

function retentionExpiresAt(deletedAt: Date, retentionDays: number) {
  const purgeAt = new Date(deletedAt)
  purgeAt.setUTCDate(purgeAt.getUTCDate() + retentionDays)
  return purgeAt
}

export async function assertEmailAvailableForRegistration(
  db: Pick<Db, 'query'>,
  email: string,
  excludeUserId?: string,
  retentionDays = ACCOUNT_RETENTION_DAYS_DEFAULT,
) {
  const rows = await db.query.users.findMany({
    columns: { id: true, deletedAt: true, purgeAt: true },
    where: eq(users.email, email),
  })
  const active = rows.find(row => !row.deletedAt && row.id !== excludeUserId)
  if (active)
    throw new ConflictError(`Email '${email}' is already registered`)

  const now = new Date()
  const recoverable = rows.find(row => row.deletedAt !== null
    && (row.purgeAt ?? retentionExpiresAt(row.deletedAt, retentionDays)) > now)
  if (recoverable)
    throw new ConflictError(`Email '${email}' belongs to a recently deleted account. Restore the account instead.`)
}

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

export async function createUser(db: Db, body: CreateUserBody, retentionDays = ACCOUNT_RETENTION_DAYS_DEFAULT) {
  await assertEmailAvailableForRegistration(db, body.email, undefined, retentionDays)

  const passwordHash = await bcrypt.hash(body.password, 12)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(users)
      .values({ email: body.email, passwordHash })
      .returning({ id: users.id, email: users.email, createdAt: users.createdAt, updatedAt: users.updatedAt })

    await tx.insert(profiles).values({ userId: row.id })

    return toUser({ ...row, profile: null })
  }).catch(err => rethrowEmailConflict(err, body.email))
}

export async function updateUser(db: Db, id: string, body: UpdateUserBody, retentionDays = ACCOUNT_RETENTION_DAYS_DEFAULT) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    if (!existing)
      throw new NotFoundError('User', id)

    if (body.email !== undefined) {
      await assertEmailAvailableForRegistration(tx, body.email, id, retentionDays)
      await tx.update(users).set({ email: body.email }).where(eq(users.id, id)).catch(err => rethrowEmailConflict(err, body.email!))
    }
    if (body.profile !== undefined)
      await tx.update(profiles).set(body.profile).where(eq(profiles.userId, id))

    const [updated] = await tx
      .select({ id: users.id, email: users.email, createdAt: users.createdAt, updatedAt: users.updatedAt })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    const profile = await tx.query.profiles.findFirst({
      columns: profileColumns,
      where: eq(profiles.userId, id),
    })
    return toUser({ ...updated, profile: profile ?? null })
  })
}

export async function deleteUser(db: Db, id: string, deletedBy?: string, retentionDays = ACCOUNT_RETENTION_DAYS_DEFAULT) {
  const deletedAt = new Date()
  const [deleted] = await db
    .update(users)
    .set({ deletedAt, deletedBy: deletedBy ?? null, purgeAt: retentionExpiresAt(deletedAt, retentionDays) })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning({ id: users.id })
  if (!deleted)
    throw new NotFoundError('User', id)
}
