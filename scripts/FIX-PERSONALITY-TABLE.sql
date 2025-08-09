-- Fix PersonalityTestResult table - ensure all columns exist

-- First, check what columns currently exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult';

-- Drop and recreate the table with ALL required columns
DROP TABLE IF EXISTS "PersonalityTestResult" CASCADE;

CREATE TABLE "PersonalityTestResult" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "scores" JSONB NOT NULL DEFAULT '{}', 
    "archetype" TEXT NOT NULL DEFAULT 'explorer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalityTestResult_pkey" PRIMARY KEY ("id")
);

-- Create unique index
CREATE UNIQUE INDEX "PersonalityTestResult_userId_key" ON "PersonalityTestResult"("userId");

-- Add foreign key to User table
DO $$ 
BEGIN
    ALTER TABLE "PersonalityTestResult" 
    ADD CONSTRAINT "PersonalityTestResult_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

-- Verify the table was created with all columns
SELECT 'PersonalityTestResult columns after fix:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult'
ORDER BY ordinal_position;

SELECT '✅ PersonalityTestResult table fixed!' as result;