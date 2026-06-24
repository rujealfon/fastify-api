import type { Db } from '@/db/index.js'
import type { CreateRoleBody, UpdateRolePermissionsBody } from '@/modules/roles/schemas/index.js'
import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { PG_UNIQUE_VIOLATION } from '@/common/constants/index.js'
import { ConflictError } from '@/common/errors/ConflictError.js'
import { NotFoundError } from '@/common/errors/NotFoundError.js'
import { permissions, rolePermissions, roles, users } from '@/db/schema/index.js'

async function findRoleOrThrow(db: Db, id: string) {
  const row = await db.query.roles.findFirst({ where: eq(roles.id, id) })
  if (!row)
    throw new NotFoundError('Role', id)
  return row
}

async function getPermissionIdsByKeys(db: Db, keys: string[]) {
  if (!keys.length)
    return []
  return db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.key, keys))
}

function toRoleDetail(role: { id: string, name: string, description: string | null, createdAt: Date, updatedAt: Date }, permKeys: string[]) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: permKeys,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }
}

export async function findAllRoles(db: Db, page: number, limit: number) {
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissionCount: count(rolePermissions.permissionId),
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .groupBy(roles.id)
      .offset((page - 1) * limit)
      .limit(limit),
    db.select({ total: count() }).from(roles),
  ])
  return {
    data: rows.map(r => ({
      ...r,
      permissionCount: Number(r.permissionCount),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total: Number(total),
  }
}

export async function findRoleById(db: Db, id: string) {
  const role = await findRoleOrThrow(db, id)
  const perms = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.roleId, id))
  return toRoleDetail(role, perms.map(p => p.key))
}

export async function createRole(db: Db, body: CreateRoleBody) {
  try {
    return await db.transaction(async (tx) => {
      const [role] = await tx
        .insert(roles)
        .values({ name: body.name, description: body.description ?? null })
        .returning()

      const permRows = body.permissions?.length
        ? await tx.select({ id: permissions.id, key: permissions.key }).from(permissions).where(inArray(permissions.key, body.permissions))
        : []

      if (permRows.length) {
        await tx.insert(rolePermissions).values(permRows.map(p => ({ roleId: role.id, permissionId: p.id })))
      }

      return toRoleDetail(role, permRows.map(p => p.key))
    })
  }
  catch (err) {
    if ((err as { cause?: { code?: string } })?.cause?.code === PG_UNIQUE_VIOLATION)
      throw new ConflictError(`Role '${body.name}' already exists`)
    throw err
  }
}

export async function updateRolePermissions(db: Db, id: string, body: UpdateRolePermissionsBody) {
  await findRoleOrThrow(db, id)

  const permRows = await getPermissionIdsByKeys(db, body.permissions)

  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id))
    if (permRows.length) {
      await tx.insert(rolePermissions).values(permRows.map(p => ({ roleId: id, permissionId: p.id })))
    }
  })

  return findRoleById(db, id)
}

export async function deleteRole(db: Db, id: string) {
  const role = await findRoleOrThrow(db, id)

  const [{ userCount }] = await db
    .select({ userCount: count() })
    .from(users)
    .where(and(eq(users.role, role.name), isNull(users.deletedAt)))

  if (Number(userCount) > 0)
    throw new ConflictError(`Cannot delete role '${role.name}': ${userCount} active user(s) currently assigned to it`)

  await db.delete(roles).where(eq(roles.id, id))
}
