import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { Db } from '../../../db/index.js'
import { users } from '../../../db/schema/index.js'
import { ConflictError } from '../../../common/errors/ConflictError.js'
import { UnauthorizedError } from '../../../common/errors/UnauthorizedError.js'
import type { RegisterBody, LoginBody } from '../schemas/index.js'

export async function registerUser(db: Db, body: RegisterBody) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) })
  if (existing) throw new ConflictError(`Email '${body.email}' is already registered`)

  const passwordHash = await bcrypt.hash(body.password, 12)
  const [user] = await db
    .insert(users)
    .values({ name: body.name, email: body.email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email })

  return user
}

export async function loginUser(db: Db, body: LoginBody) {
  const user = await db.query.users.findFirst({ where: eq(users.email, body.email) })
  if (!user) throw new UnauthorizedError('Invalid email or password')

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) throw new UnauthorizedError('Invalid email or password')

  return { id: user.id, email: user.email, name: user.name }
}
