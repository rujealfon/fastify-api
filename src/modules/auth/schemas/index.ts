import { z } from 'zod'

export const registerBodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authTokensSchema = z.object({
  token: z.string(),
})

export const authUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type AuthTokens = z.infer<typeof authTokensSchema>
export type AuthUser = z.infer<typeof authUserSchema>

export interface JwtPayload {
  sub: string
  email: string
}
