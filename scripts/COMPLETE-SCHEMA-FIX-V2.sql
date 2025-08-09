-- COMPLETE SCHEMA FIX V2: Fixes ALL schema mismatches
-- Run this ONE script to fix everything

-- ============================================
-- STEP 1: Create UserRole enum
-- ============================================
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Fix User table
-- ============================================
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" "UserRole" DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "consentTimestamp" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dataExportRequested" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletionRequested" TIMESTAMP(3);

-- ============================================
-- STEP 3: Drop and recreate Profile with ALL columns
-- ============================================
DROP TABLE IF EXISTS "Profile" CASCADE;

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- Basic Info
    "displayName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "dateOfBirth" TIMESTAMP(3),
    
    -- Personality
    "personalityTest" JSONB,
    "archetype" TEXT,
    "personalityScores" JSONB,
    
    -- Companion
    "companionName" TEXT DEFAULT 'Luna',
    "companionAvatar" TEXT,
    "companionBackstory" TEXT,
    "companionVoice" TEXT DEFAULT 'alloy',
    
    -- Preferences
    "preferredTone" TEXT DEFAULT 'balanced',
    "preferredTopics" TEXT[],
    "preferredLanguage" TEXT DEFAULT 'en',
    "messageFrequency" TEXT DEFAULT 'normal',
    "notificationSettings" JSONB DEFAULT '{}',
    
    -- Relationship Progress
    "trustLevel" INTEGER DEFAULT 0,
    "messageCount" INTEGER DEFAULT 0,
    "relationshipStage" TEXT DEFAULT 'initial',
    "milestones" JSONB DEFAULT '[]',
    "lastInteraction" TIMESTAMP(3),
    
    -- Daily Tracking
    "dailyMessageCount" INTEGER DEFAULT 0,
    "lastMessageDate" TIMESTAMP(3),
    "streak" INTEGER DEFAULT 0,
    "longestStreak" INTEGER DEFAULT 0,
    
    -- Meta
    "personalityTestCompleted" BOOLEAN DEFAULT false,
    "onboardingCompleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 4: Drop and recreate Subscription
-- ============================================
DROP TABLE IF EXISTS "Subscription" CASCADE;

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plan" TEXT DEFAULT 'free',
    "status" TEXT DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 5: Drop and recreate AuditLog with ALL columns
-- ============================================
DROP TABLE IF EXISTS "AuditLog" CASCADE;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 6: Create PersonalityTestResult
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

-- ============================================
-- STEP 7: Create Conversation table
-- ============================================
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "topics" TEXT[],
    "messageCount" INTEGER DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "archived" BOOLEAN DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 8: Create Message table
-- ============================================
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 9: Create Memory table
-- ============================================
CREATE TABLE IF NOT EXISTS "Memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "importance" DOUBLE PRECISION DEFAULT 0.5,
    "emotionalValence" DOUBLE PRECISION DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 10: Create Activity table
-- ============================================
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 11: Create Payment table
-- ============================================
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 12: Create ConversionEvent table
-- ============================================
CREATE TABLE IF NOT EXISTS "ConversionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 13: Create WaitlistEntry table
-- ============================================
CREATE TABLE IF NOT EXISTS "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referralSource" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 14: Create ContactSubmission table
-- ============================================
CREATE TABLE IF NOT EXISTS "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 15: Create all unique indexes
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalityTestResult_userId_key" ON "PersonalityTestResult"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- ============================================
-- STEP 16: Create performance indexes
-- ============================================
CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "Conversation"("userId");
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS "Memory_userId_idx" ON "Memory"("userId");
CREATE INDEX IF NOT EXISTS "Memory_type_idx" ON "Memory"("type");
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "ConversionEvent_userId_idx" ON "ConversionEvent"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- ============================================
-- STEP 17: Add all foreign key constraints
-- ============================================
DO $$ BEGIN
    ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "PersonalityTestResult" ADD CONSTRAINT "PersonalityTestResult_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" 
        FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ COMPLETE SCHEMA FIX V2 APPLIED!' as status;

-- Count tables
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify critical columns exist
SELECT 'Checking critical columns...' as check_status;

-- Check Profile.displayName
SELECT COUNT(*) as has_displayname 
FROM information_schema.columns 
WHERE table_name = 'Profile' AND column_name = 'displayName';

-- Check AuditLog.success
SELECT COUNT(*) as has_success 
FROM information_schema.columns 
WHERE table_name = 'AuditLog' AND column_name = 'success';

-- Check Subscription.plan
SELECT COUNT(*) as has_plan 
FROM information_schema.columns 
WHERE table_name = 'Subscription' AND column_name = 'plan';