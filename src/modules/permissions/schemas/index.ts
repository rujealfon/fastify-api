import { z } from 'zod'

export const permissionSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
})

export const createPermissionBodySchema = z.object({
  key: z.string().min(1).max(100),
  description: z.string().optional(),
})

export type PermissionItem = z.infer<typeof permissionSchema>
export type CreatePermissionBody = z.infer<typeof createPermissionBodySchema>
