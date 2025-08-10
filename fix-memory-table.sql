-- ========================================
-- FIX MEMORY TABLE - ADD MISSING COLUMNS
-- Run this in Neon SQL Editor to fix the schema
-- ========================================

-- 1. Add the missing context column to Memory table
ALTER TABLE "Memory" 
ADD COLUMN IF NOT EXISTS context TEXT;

-- 2. Add any other potentially missing columns
ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS importance DOUBLE PRECISION DEFAULT 0.5;

ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS embedding DOUBLE PRECISION[];

ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS "lastAccessed" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS "accessCount" INTEGER DEFAULT 0;

-- 3. Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- 4. Test that we can now query with context column
SELECT 
    id,
    "userId",
    type,
    content,
    context,
    importance,
    "createdAt"
FROM "Memory"
LIMIT 1;

-- 5. Check final status
SELECT 
    '✅ Memory table has been fixed!' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'Memory';