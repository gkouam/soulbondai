-- CRITICAL FIX: Create UserRole enum and update User table
-- Run this IMMEDIATELY in Neon SQL Editor to fix the OAuth error

-- 1. Create the UserRole enum type
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add role column to User table with the enum type
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" "UserRole" DEFAULT 'USER';

-- 3. Add other missing columns
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "consentTimestamp" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dataExportRequested" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletionRequested" TIMESTAMP(3);

-- 4. Verify the enum and columns were created
SELECT 'UserRole enum created!' as status;
SELECT enum_range(NULL::"UserRole") as user_roles;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;