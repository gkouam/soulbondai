-- Add PersonalityTestResult table
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS "PersonalityTestResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "archetype" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "PersonalityTestResult_pkey" PRIMARY KEY ("id")
);

-- Create unique index for userId
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalityTestResult_userId_key" ON "PersonalityTestResult"("userId");

-- Add foreign key constraint
ALTER TABLE "PersonalityTestResult" DROP CONSTRAINT IF EXISTS "PersonalityTestResult_userId_fkey";
ALTER TABLE "PersonalityTestResult" ADD CONSTRAINT "PersonalityTestResult_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify table was created
SELECT 'PersonalityTestResult table created!' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult' 
ORDER BY ordinal_position;