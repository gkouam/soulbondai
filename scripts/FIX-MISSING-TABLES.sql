-- FIX MISSING TABLES - Adds PersonalityTestResult and ConsentRecord
-- Run this script in Neon to fix the current errors

-- ============================================
-- STEP 1: Create PersonalityTestResult table
-- ============================================
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
DO $$ BEGIN
    ALTER TABLE "PersonalityTestResult" ADD CONSTRAINT "PersonalityTestResult_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- STEP 2: Create ConsentRecord table
-- ============================================
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "version" TEXT NOT NULL,
    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ConsentRecord
CREATE INDEX IF NOT EXISTS "ConsentRecord_userId_consentType_idx" ON "ConsentRecord"("userId", "consentType");
CREATE INDEX IF NOT EXISTS "ConsentRecord_timestamp_idx" ON "ConsentRecord"("timestamp");

-- Note: ConsentRecord doesn't have a foreign key to User in the Prisma schema
-- This allows tracking consent even for non-registered users

-- ============================================
-- STEP 3: Verify Profile table has nickname column
-- ============================================
ALTER TABLE "Profile" 
ADD COLUMN IF NOT EXISTS "nickname" TEXT;

-- ============================================
-- STEP 4: Verify Profile table has all needed columns from FINAL-COMPLETE-SCHEMA
-- ============================================
ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "avatar" TEXT,
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "personalityTest" JSONB,
ADD COLUMN IF NOT EXISTS "archetype" TEXT,
ADD COLUMN IF NOT EXISTS "personalityScores" JSONB,
ADD COLUMN IF NOT EXISTS "companionName" TEXT DEFAULT 'Luna',
ADD COLUMN IF NOT EXISTS "companionAvatar" TEXT,
ADD COLUMN IF NOT EXISTS "companionBackstory" TEXT,
ADD COLUMN IF NOT EXISTS "companionVoice" TEXT DEFAULT 'alloy',
ADD COLUMN IF NOT EXISTS "preferredTone" TEXT DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS "preferredTopics" TEXT[],
ADD COLUMN IF NOT EXISTS "conversationStyle" TEXT DEFAULT 'casual',
ADD COLUMN IF NOT EXISTS "creativityLevel" INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS "emotionalDepth" INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS "voiceEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "autoPlayVoice" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "voiceSpeed" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS "relationshipStage" TEXT DEFAULT 'new_friend',
ADD COLUMN IF NOT EXISTS "trustLevel" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "interactionCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastInteraction" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "milestones" JSONB,
ADD COLUMN IF NOT EXISTS "significantMemories" JSONB[],
ADD COLUMN IF NOT EXISTS "personalityTestCompleted" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "messageCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "dailyMessageCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastMessageDate" TIMESTAMP(3);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ MISSING TABLES FIXED!' as status;

-- Verify PersonalityTestResult exists
SELECT 'PersonalityTestResult table:' as check_status;
SELECT COUNT(*) as exists FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'PersonalityTestResult';

-- Verify ConsentRecord exists
SELECT 'ConsentRecord table:' as check_status;
SELECT COUNT(*) as exists FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'ConsentRecord';

-- Verify Profile has nickname column
SELECT 'Profile nickname column:' as check_status;
SELECT COUNT(*) as has_nickname FROM information_schema.columns 
WHERE table_name = 'Profile' AND column_name = 'nickname';

-- List all columns in PersonalityTestResult
SELECT 'PersonalityTestResult columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult' 
ORDER BY ordinal_position;

-- List all columns in ConsentRecord
SELECT 'ConsentRecord columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ConsentRecord' 
ORDER BY ordinal_position;