-- FINAL COMPLETE SCHEMA - Matches Prisma schema EXACTLY
-- This drops and recreates tables to ensure perfect alignment
-- Run this ONE script to fix ALL database issues

-- ============================================
-- STEP 1: Create UserRole enum
-- ============================================
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Ensure User table has all columns
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
-- STEP 3: DROP AND RECREATE Profile with EXACT schema
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
    "conversationStyle" TEXT DEFAULT 'casual',
    "creativityLevel" INTEGER DEFAULT 50,
    "emotionalDepth" INTEGER DEFAULT 50,
    "voiceEnabled" BOOLEAN DEFAULT false,
    "autoPlayVoice" BOOLEAN DEFAULT false,
    "voiceSpeed" DOUBLE PRECISION DEFAULT 1.0,
    
    -- Relationship
    "relationshipStage" TEXT DEFAULT 'new_friend',
    "trustLevel" INTEGER DEFAULT 0,
    "interactionCount" INTEGER DEFAULT 0,
    "lastInteraction" TIMESTAMP(3),
    "milestones" JSONB,
    "significantMemories" JSONB[],
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Legacy fields for compatibility
    "personalityTestCompleted" BOOLEAN DEFAULT false,
    "messageCount" INTEGER DEFAULT 0,
    "dailyMessageCount" INTEGER DEFAULT 0,
    "lastMessageDate" TIMESTAMP(3),
    
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 4: DROP AND RECREATE Subscription
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
-- STEP 5: DROP AND RECREATE AuditLog
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
-- STEP 6: Create Conversation table
-- ============================================
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "archived" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 7: Create Message table
-- ============================================
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 8: Create Memory table
-- ============================================
CREATE TABLE IF NOT EXISTS "Memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "importance" DOUBLE PRECISION DEFAULT 0.5,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 9: Create Activity table
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
-- STEP 10: Create PersonalityTestResult
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
-- STEP 15: Create PhoneVerification table
-- ============================================
CREATE TABLE IF NOT EXISTS "PhoneVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verified" BOOLEAN DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 16: Create Device table
-- ============================================
CREATE TABLE IF NOT EXISTS "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "lastActive" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "pushToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- STEP 17: Create ALL unique indexes
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalityTestResult_userId_key" ON "PersonalityTestResult"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistEntry_email_key" ON "WaitlistEntry"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Device_deviceId_key" ON "Device"("deviceId");

-- ============================================
-- STEP 18: Create ALL performance indexes
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
CREATE INDEX IF NOT EXISTS "PhoneVerification_userId_idx" ON "PhoneVerification"("userId");
CREATE INDEX IF NOT EXISTS "Device_userId_idx" ON "Device"("userId");

-- ============================================
-- STEP 19: Add ALL foreign key constraints
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

DO $$ BEGIN
    ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT '✅ FINAL COMPLETE SCHEMA APPLIED!' as status;

-- Count tables
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify critical columns in Profile
SELECT 'Profile columns:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Profile' 
AND column_name IN ('displayName', 'conversationStyle', 'creativityLevel', 'emotionalDepth')
ORDER BY column_name;

-- Verify AuditLog has success column
SELECT 'AuditLog success column:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'AuditLog' 
AND column_name = 'success';

-- Verify Subscription has plan column
SELECT 'Subscription plan column:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Subscription' 
AND column_name = 'plan';