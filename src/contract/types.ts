import type { z } from 'zod'
import type { Permission } from '@/common/constants/index.js'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface RouteSchema<
  TQuery extends z.ZodType | undefined = undefined,
  TParams extends z.ZodType | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
  TResponses extends Record<number, z.ZodType> = Record<number, z.ZodType>,
> {
  method: HttpMethod
  path: string
  auth?: boolean
  admin?: boolean
  permission?: Permission
  query?: TQuery
  params?: TParams
  body?: TBody
  responses: TResponses
}

export type RouteMap = Record<string, {
  method: HttpMethod
  path: string
  auth?: boolean
  admin?: boolean
  permission?: Permission
  tags?: string[]
  query?: z.ZodType
  params?: z.ZodType
  body?: z.ZodType
  responses: Record<number, z.ZodType>
}>
