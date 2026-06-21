import type { Db } from '@/db/index.js'
import type { LoginBody } from '@/modules/auth/schemas/index.js'
import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { UnauthorizedError } from '@/common/errors/UnauthorizedError.js'
import { users } from '@/db/schema/index.js'

const DUMMY_BCRYPT_HASH = '$2a$12$KIXBp.K9tFRnNEBLkFpCq.TL1BOT4SuGLcvzfWGBzm8NhFGnEsHZC'

export async function loginUser(db: Db, body: LoginBody) {
  const user = await db.query.users.findFirst({ where: and(eq(users.email, body.email), isNull(users.deletedAt)) })

  const hash = user?.passwordHash ?? DUMMY_BCRYPT_HASH
  const valid = await bcrypt.compare(body.password, hash)

  if (!user || !valid)
    throw new UnauthorizedError('Invalid email or password')

  return { id: user.id, email: user.email }
}
