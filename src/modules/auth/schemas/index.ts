import { z } from 'zod'

export const registerBodySchema = z.object({
  email: z.email().meta({ examples: ['alice@example.com'] }),
  password: z.string().min(8).max(72).meta({ examples: ['securepassword123'] }),
})

export const loginBodySchema = z.object({
  email: z.email().meta({ examples: ['alice@example.com'] }),
  password: z.string().min(1).meta({ examples: ['securepassword123'] }),
})

export const authTokensSchema = z.object({
  token: z.string().meta({ examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTllZTRlNC1iZDdkLTdlMGQtODQwMi1lZWI3M2M1NzhhMDAiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA1MzE1MDAwfQ.abc123'] }),
})

export const authUserSchema = z.object({
  id: z.uuid().meta({ examples: ['019ee4e4-bd7d-7e0d-8402-eeb73c578a00'] }),
  email: z.email().meta({ examples: ['alice@example.com'] }),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type AuthTokens = z.infer<typeof authTokensSchema>
export type AuthUser = z.infer<typeof authUserSchema>

export interface JwtPayload {
  sub: string
  email: string
}
