import type { Db } from '@/db/index.js'
import type { CreatePermissionBody } from '@/modules/permissions/schemas/index.js'
import { count } from 'drizzle-orm'
import { PG_UNIQUE_VIOLATION } from '@/common/constants/index.js'
import { ConflictError } from '@/common/errors/ConflictError.js'
import { permissions } from '@/db/schema/index.js'

export async function findAllPermissions(db: Db, page: number, limit: number) {
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(permissions).offset((page - 1) * limit).limit(limit),
    db.select({ total: count() }).from(permissions),
  ])
  return {
    data: rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total: Number(total),
  }
}

export async function createPermission(db: Db, body: CreatePermissionBody) {
  try {
    const [row] = await db
      .insert(permissions)
      .values({ key: body.key, description: body.description ?? null })
      .returning()
    return { ...row, createdAt: row.createdAt.toISOString() }
  }
  catch (err) {
    if ((err as { cause?: { code?: string } })?.cause?.code === PG_UNIQUE_VIOLATION)
      throw new ConflictError(`Permission '${body.key}' already exists`)
    throw err
  }
}
