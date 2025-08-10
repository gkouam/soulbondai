-- ========================================
-- ADD MISSING COLUMNS TO MEMORY TABLE
-- Run this in Neon SQL Editor to fix the schema
-- ========================================

-- 1. Add the missing context column (REQUIRED for chat to work)
ALTER TABLE "Memory" 
ADD COLUMN IF NOT EXISTS context TEXT;

-- 2. Add embedding column for vector similarity search
ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS embedding DOUBLE PRECISION[];

-- 3. Add lastAccessed column for memory decay
ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS "lastAccessed" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- 4. Add accessCount column for memory importance tracking
ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS "accessCount" INTEGER DEFAULT 0;

-- 5. Verify all columns are now present
SELECT 
    ordinal_position,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- 6. Test that we can now query with all expected columns
SELECT 
    id,
    "userId",
    type,
    content,
    context,  -- This was missing
    importance,
    embedding,  -- This was missing
    "createdAt",
    "lastAccessed",  -- This was missing
    "accessCount"  -- This was missing
FROM "Memory"
LIMIT 1;

-- 7. Final verification - should show SUCCESS
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'context') 
        THEN '✅ context column EXISTS' 
        ELSE '❌ context column MISSING' 
    END as context_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'embedding') 
        THEN '✅ embedding column EXISTS' 
        ELSE '❌ embedding column MISSING' 
    END as embedding_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'lastAccessed') 
        THEN '✅ lastAccessed column EXISTS' 
        ELSE '❌ lastAccessed column MISSING' 
    END as lastAccessed_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'accessCount') 
        THEN '✅ accessCount column EXISTS' 
        ELSE '❌ accessCount column MISSING' 
    END as accessCount_status;