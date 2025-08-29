-- Migration to convert BROKER users to SELLER
-- This migration should be run after the schema has been updated to remove BROKER role

UPDATE users 
SET role = 'SELLER' 
WHERE role = 'BROKER';

-- Log the number of users updated
-- Note: This will show in the migration output