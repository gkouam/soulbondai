-- Force add missing columns to Message table
ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS "audioUrl" TEXT,
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Verify the columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Message' 
AND column_name IN ('audioUrl', 'imageUrl');