-- Fix Subscription table to match Prisma schema
-- Run this IMMEDIATELY in Neon SQL Editor

-- Add missing columns or rename existing ones
ALTER TABLE "Subscription" 
ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'free';

-- If 'tier' column exists and 'plan' doesn't, migrate the data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Subscription' AND column_name = 'tier') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'Subscription' AND column_name = 'plan') 
    THEN
        ALTER TABLE "Subscription" RENAME COLUMN "tier" TO "plan";
    END IF;
END $$;

-- Ensure status column exists with correct default
ALTER TABLE "Subscription" 
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';

-- Add stripeCustomerId if missing
ALTER TABLE "Subscription" 
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- Add unique constraint on stripeCustomerId if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'Subscription_stripeCustomerId_key') 
    THEN
        ALTER TABLE "Subscription" 
        ADD CONSTRAINT "Subscription_stripeCustomerId_key" UNIQUE ("stripeCustomerId");
    END IF;
END $$;

-- Add cancelledAt column (schema uses cancelledAt, not canceledAt)
ALTER TABLE "Subscription" 
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);

-- Remove old columns that don't match schema
ALTER TABLE "Subscription" 
DROP COLUMN IF EXISTS "interval",
DROP COLUMN IF EXISTS "cancelAtPeriodEnd",
DROP COLUMN IF EXISTS "canceledAt",
DROP COLUMN IF EXISTS "startedAt",
DROP COLUMN IF EXISTS "endedAt";

-- Verify the table structure
SELECT 'Subscription table fixed!' as status;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Subscription'
ORDER BY ordinal_position;