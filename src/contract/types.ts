import type { z } from 'zod'
import { PERMISSIONS } from '@/common/constants/index.js'

export { PERMISSIONS }

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type ValueOf<T> = T[keyof T]

export type PermissionName = {
  [Group in keyof typeof PERMISSIONS]: ValueOf<typeof PERMISSIONS[Group]>
}[keyof typeof PERMISSIONS]

export interface RouteSchema<
  TQuery extends z.ZodType | undefined = undefined,
  TParams extends z.ZodType | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
  TResponses extends Record<number, z.ZodType> = Record<number, z.ZodType>,
> {
  method: HttpMethod
  path: string
  auth?: boolean
  optionalAuth?: boolean
  permission?: PermissionName
  rateLimit?: {
    max: number
    timeWindow: string
  }
  query?: TQuery
  params?: TParams
  body?: TBody
  responses: TResponses
}

export type RouteMap = Record<string, {
  method: HttpMethod
  path: string
  auth?: boolean
  optionalAuth?: boolean
  permission?: PermissionName
  rateLimit?: {
    max: number
    timeWindow: string
  }
  tags?: string[]
  query?: z.ZodType
  params?: z.ZodType
  body?: z.ZodType
  responses: Record<number, z.ZodType>
}>
