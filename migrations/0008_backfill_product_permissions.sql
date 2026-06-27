-- Backfill product permissions for databases that already ran seedRoles before
-- product routes started enforcing product:* permissions.
INSERT INTO "permissions" ("id", "resource", "action", "scope")
VALUES
  (gen_random_uuid(), 'product', 'create', 'any'),
  (gen_random_uuid(), 'product', 'read', 'any'),
  (gen_random_uuid(), 'product', 'update', 'any'),
  (gen_random_uuid(), 'product', 'delete', 'any')
ON CONFLICT ("resource", "action", "scope") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" IN ('super-admin', 'admin')
  AND p."resource" = 'product'
  AND p."action" IN ('create', 'read', 'update', 'delete')
  AND p."scope" = 'any'
ON CONFLICT DO NOTHING;
