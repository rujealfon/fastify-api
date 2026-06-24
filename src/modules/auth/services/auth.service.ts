import type { Db } from '@/db/index.js'
import type { LoginBody, RegisterBody } from '@/modules/auth/schemas/index.js'
import bcrypt from 'bcryptjs'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { PG_UNIQUE_VIOLATION } from '@/common/constants/index.js'
import { ConflictError } from '@/common/errors/ConflictError.js'
import { UnauthorizedError } from '@/common/errors/UnauthorizedError.js'
import { profiles, users } from '@/db/schema/index.js'
import { logActivity } from '@/modules/activity-logs/helpers/log-activity.js'

export async function registerUser(db: Db, body: RegisterBody) {
  // An email may have at most one active row but several soft-deleted rows
  // (the partial unique index only covers deletedAt IS NULL), so the conflict
  // check must be scoped to active rows specifically.
  const active = await db.query.users.findFirst({ where: and(eq(users.email, body.email), isNull(users.deletedAt)) })
  if (active)
    throw new ConflictError(`Email '${body.email}' is already registered`)

  // Reactivate a soft-deleted account if the password matches (within the 90-day
  // window before the cleanup cron hard-deletes it). Profile row still exists, so
  // we only clear the soft-delete flags.
  const dead = await db.query.users.findFirst({ where: and(eq(users.email, body.email), isNotNull(users.deletedAt)) })
  if (dead && await bcrypt.compare(body.password, dead.passwordHash)) {
    await db.update(users).set({ deletedAt: null, deletedBy: null }).where(eq(users.id, dead.id))
    logActivity(db, { userId: dead.id, action: 'auth.account_restored', resourceType: 'user', resourceId: dead.id, metadata: { email: dead.email } })
    return { id: dead.id, email: dead.email }
  }

  const passwordHash = await bcrypt.hash(body.password, 12)

  try {
    const user = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(users)
        .values({ email: body.email, passwordHash })
        .returning({ id: users.id, email: users.email })

      await tx.insert(profiles).values({ userId: row.id })

      return row
    })
    logActivity(db, { userId: user.id, action: 'auth.registered', resourceType: 'user', resourceId: user.id, metadata: { email: user.email } })
    return user
  }
  catch (err) {
    // Two concurrent registrations of the same new email race past the active
    // check above; the partial unique index rejects the loser with 23505.
    const pgCode = (err as { cause?: { code?: string } })?.cause?.code
    if (pgCode === PG_UNIQUE_VIOLATION)
      throw new ConflictError(`Email '${body.email}' is already registered`)
    throw err
  }
}

export async function loginUser(db: Db, body: LoginBody) {
  const user = await db.query.users.findFirst({ where: and(eq(users.email, body.email), isNull(users.deletedAt)) })
  if (!user)
    throw new UnauthorizedError('Invalid email or password')

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid)
    throw new UnauthorizedError('Invalid email or password')

  return { id: user.id, email: user.email, role: user.role }
}
