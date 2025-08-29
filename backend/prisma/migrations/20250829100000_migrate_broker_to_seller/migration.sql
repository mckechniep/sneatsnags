-- Migration: Convert BROKER users to SELLER and remove BROKER from enum

-- First, update all users with BROKER role to SELLER
UPDATE "users" 
SET "role" = 'SELLER' 
WHERE "role" = 'BROKER';

-- Create new enum without BROKER
CREATE TYPE "UserRole_new" AS ENUM ('BUYER', 'SELLER', 'ADMIN');

-- Update the table to use the new enum
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'BUYER';

-- Drop the old enum
DROP TYPE "UserRole";

-- Rename the new enum to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";