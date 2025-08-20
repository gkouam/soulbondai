-- Check and update admin role for kouam7@gmail.com
SELECT id, email, role FROM "User" WHERE email = 'kouam7@gmail.com';

-- Update to ADMIN role if needed
UPDATE "User" SET role = 'ADMIN' WHERE email = 'kouam7@gmail.com';

-- Verify the update
SELECT id, email, role FROM "User" WHERE email = 'kouam7@gmail.com';