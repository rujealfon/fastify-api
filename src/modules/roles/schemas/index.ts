import { z } from 'zod'

export const roleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  permissionCount: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const roleDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const createRoleBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

export const updateRolePermissionsBodySchema = z.object({
  permissions: z.array(z.string()),
})

export type RoleItem = z.infer<typeof roleSchema>
export type RoleDetail = z.infer<typeof roleDetailSchema>
export type CreateRoleBody = z.infer<typeof createRoleBodySchema>
export type UpdateRolePermissionsBody = z.infer<typeof updateRolePermissionsBodySchema>
