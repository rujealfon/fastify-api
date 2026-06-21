import type { Db } from '@/db/index.js'
import type { LoginBody } from '@/modules/auth/schemas/index.js'
import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { DUMMY_BCRYPT_HASH } from '@/common/constants.js'
import { UnauthorizedError } from '@/common/errors/UnauthorizedError.js'
import { users } from '@/db/schema/index.js'

export async function loginUser(db: Db, body: LoginBody) {
  const user = await db.query.users.findFirst({ where: and(eq(users.email, body.email), isNull(users.deletedAt)) })

  const hash = user?.passwordHash ?? DUMMY_BCRYPT_HASH
  const valid = await bcrypt.compare(body.password, hash)

  if (!user || !valid)
    throw new UnauthorizedError('Invalid email or password')

  return { id: user.id, email: user.email }
}
