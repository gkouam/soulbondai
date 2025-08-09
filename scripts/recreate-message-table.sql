-- First, backup any existing messages (if needed)
-- DROP TABLE IF EXISTS "Message_backup";
-- CREATE TABLE "Message_backup" AS SELECT * FROM "Message";

-- Drop the existing Message table
DROP TABLE IF EXISTS "Message" CASCADE;

-- Recreate Message table with all columns
CREATE TABLE "Message" (
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

-- Create index for conversationId
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- Add foreign key constraint
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" 
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Message' 
ORDER BY ordinal_position;