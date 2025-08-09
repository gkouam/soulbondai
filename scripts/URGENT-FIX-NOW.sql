-- URGENT: Run this SQL immediately in Neon to fix the errors
-- This creates the missing PersonalityTestResult table

CREATE TABLE IF NOT EXISTS "PersonalityTestResult" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalityTestResult_userId_key" ON "PersonalityTestResult"("userId");

-- Add foreign key
ALTER TABLE "PersonalityTestResult" 
ADD CONSTRAINT "PersonalityTestResult_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Create ConsentRecord table for GDPR
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- Add indexes for ConsentRecord
CREATE INDEX IF NOT EXISTS "ConsentRecord_userId_consentType_idx" ON "ConsentRecord"("userId", "consentType");
CREATE INDEX IF NOT EXISTS "ConsentRecord_timestamp_idx" ON "ConsentRecord"("timestamp");

-- Add nickname column to Profile if missing
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "nickname" TEXT;

-- Quick verification
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('PersonalityTestResult', 'ConsentRecord');