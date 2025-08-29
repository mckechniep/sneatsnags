-- Migration to convert BROKER users to SELLER and remove BROKER role

-- Step 1: Update all BROKER users to SELLER
UPDATE "users" 
SET "role" = 'SELLER' 
WHERE "role" = 'BROKER';

-- Step 2: Remove BROKER from UserRole enum
-- This will be done by Prisma automatically when we remove BROKER from schema