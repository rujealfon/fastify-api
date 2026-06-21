ALTER TABLE "users" ADD COLUMN "purge_at" timestamp;
UPDATE "users" SET "purge_at" = "deleted_at" + INTERVAL '90 days' WHERE "deleted_at" IS NOT NULL AND "purge_at" IS NULL;
