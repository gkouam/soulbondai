-- Add missing columns to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "consentGiven" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "consentTimestamp" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dataExportRequested" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletionRequested" TIMESTAMP(3);

-- Add missing columns to Profile table if it exists
ALTER TABLE "Profile" 
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
ADD COLUMN IF NOT EXISTS "significantMemories" JSONB[];

-- Add missing columns to Message table
ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB,
ADD COLUMN IF NOT EXISTS "audioUrl" TEXT,
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add missing columns to Subscription table
ALTER TABLE "Subscription"
ADD COLUMN IF NOT EXISTS "planType" TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN DEFAULT false;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Message_userId_idx" ON "Message"("userId");
CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "Conversation"("userId");
CREATE INDEX IF NOT EXISTS "Memory_userId_idx" ON "Memory"("userId");
CREATE INDEX IF NOT EXISTS "Memory_type_idx" ON "Memory"("type");
CREATE INDEX IF NOT EXISTS "Memory_importance_idx" ON "Memory"("importance");
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "Activity_type_idx" ON "Activity"("type");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX IF NOT EXISTS "ConversionEvent_event_idx" ON "ConversionEvent"("event");
CREATE INDEX IF NOT EXISTS "ConversionEvent_createdAt_idx" ON "ConversionEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");