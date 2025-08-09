-- Add missing columns to User table to match Prisma schema
-- Run this in Neon SQL Editor to fix the OAuth error

-- Add role column (CRITICAL - this is causing the current error)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER';

-- Add password reset fields
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add GDPR compliance fields
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "consentTimestamp" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dataExportRequested" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletionRequested" TIMESTAMP(3);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;