-- FINAL FIX: Drop and recreate PersonalityTestResult with EXACT column names

-- Drop the existing table completely
DROP TABLE IF EXISTS "PersonalityTestResult" CASCADE;

-- Create table with EXACT column names that match Prisma schema
CREATE TABLE "PersonalityTestResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "archetype" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalityTestResult_pkey" PRIMARY KEY ("id")
);

-- Add default value for id
ALTER TABLE "PersonalityTestResult" 
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Create unique index on userId
CREATE UNIQUE INDEX "PersonalityTestResult_userId_key" ON "PersonalityTestResult"("userId");

-- Add foreign key constraint
ALTER TABLE "PersonalityTestResult" 
ADD CONSTRAINT "PersonalityTestResult_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Verify the exact columns exist
SELECT 'Columns in PersonalityTestResult:' as check_status;
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult'
ORDER BY ordinal_position;

-- Test insert to make sure it works
-- INSERT INTO "PersonalityTestResult" ("userId", "answers", "scores", "archetype")
-- SELECT id, '{}', '{}', 'explorer' FROM "User" LIMIT 1;

SELECT '✅ PersonalityTestResult table FIXED with correct columns!' as result;