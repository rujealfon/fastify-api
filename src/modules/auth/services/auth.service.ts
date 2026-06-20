import type { Db } from '@/db/index.js'
import type { LoginBody, RegisterBody } from '@/modules/auth/schemas/index.js'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { ConflictError } from '@/common/errors/ConflictError.js'
import { UnauthorizedError } from '@/common/errors/UnauthorizedError.js'
import { profiles, users } from '@/db/schema/index.js'

export async function registerUser(db: Db, body: RegisterBody) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) })
  if (existing)
    throw new ConflictError(`Email '${body.email}' is already registered`)

  const passwordHash = await bcrypt.hash(body.password, 12)

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: body.email, passwordHash })
      .returning({ id: users.id, email: users.email })

    await tx.insert(profiles).values({ userId: user.id })

    return user
  })
}

export async function loginUser(db: Db, body: LoginBody) {
  const user = await db.query.users.findFirst({ where: eq(users.email, body.email) })
  if (!user)
    throw new UnauthorizedError('Invalid email or password')

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid)
    throw new UnauthorizedError('Invalid email or password')

  return { id: user.id, email: user.email }
}
