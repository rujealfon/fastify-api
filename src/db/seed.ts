import process from 'node:process'
import { inArray } from 'drizzle-orm'
import { PERMISSIONS, ROLES } from '@/common/constants/index.js'
import { createDb } from './index.js'
import { permissions, rolePermissions, roles } from './schema/index.js'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url)
    throw new Error('DATABASE_URL is required')

  const { db, sql } = createDb(url)

  // Upsert roles
  await db.insert(roles)
    .values([
      { name: ROLES.USER, description: 'Default user role' },
      { name: ROLES.ADMIN, description: 'Administrator role' },
      { name: ROLES.SUPER_ADMIN, description: 'Super administrator role' },
    ])
    .onConflictDoNothing()

  // Upsert permissions
  await db.insert(permissions)
    .values(Object.values(PERMISSIONS).map(key => ({ key })))
    .onConflictDoNothing()

  // Fetch current state to wire role_permissions
  const [roleRows, permRows] = await Promise.all([
    db.select().from(roles).where(inArray(roles.name, Object.values(ROLES))),
    db.select().from(permissions).where(inArray(permissions.key, Object.values(PERMISSIONS))),
  ])

  const adminRole = roleRows.find(r => r.name === ROLES.ADMIN)!
  const superAdminRole = roleRows.find(r => r.name === ROLES.SUPER_ADMIN)!
  const userRole = roleRows.find(r => r.name === ROLES.USER)!
  const adminPermKeys = new Set<string>(Object.values(PERMISSIONS).filter(k => k !== PERMISSIONS.ROLES_MANAGE))
  const userPermKeys = new Set<string>([PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE, PERMISSIONS.PROFILE_MANAGE])

  await db.insert(rolePermissions).values([
    ...permRows.filter(p => adminPermKeys.has(p.key)).map(p => ({ roleId: adminRole.id, permissionId: p.id })),
    ...permRows.map(p => ({ roleId: superAdminRole.id, permissionId: p.id })),
    ...permRows.filter(p => userPermKeys.has(p.key)).map(p => ({ roleId: userRole.id, permissionId: p.id })),
  ]).onConflictDoNothing()

  console.warn('Seed complete')
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
