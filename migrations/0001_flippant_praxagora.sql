ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp DEFAULT null;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp DEFAULT null;