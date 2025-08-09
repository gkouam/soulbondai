-- Create all required enum types for the application
-- Run this BEFORE creating tables

-- 1. Create UserRole enum (required for User table)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verify enums were created
SELECT 'All enums created!' as status;
SELECT typname, typtype, typcategory 
FROM pg_type 
WHERE typtype = 'e' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');