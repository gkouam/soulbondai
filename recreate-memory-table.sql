-- ========================================
-- RECREATE MEMORY TABLE WITH CORRECT SCHEMA
-- Only run this if the table structure is completely broken
-- ========================================

-- OPTION 1: Just add missing columns (safer - preserves data)
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'userId') THEN
        ALTER TABLE "Memory" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'type') THEN
        ALTER TABLE "Memory" ADD COLUMN type TEXT NOT NULL DEFAULT 'fact';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'content') THEN
        ALTER TABLE "Memory" ADD COLUMN content TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'context') THEN
        ALTER TABLE "Memory" ADD COLUMN context TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'importance') THEN
        ALTER TABLE "Memory" ADD COLUMN importance DOUBLE PRECISION DEFAULT 0.5;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'embedding') THEN
        ALTER TABLE "Memory" ADD COLUMN embedding DOUBLE PRECISION[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'createdAt') THEN
        ALTER TABLE "Memory" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'lastAccessed') THEN
        ALTER TABLE "Memory" ADD COLUMN "lastAccessed" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Memory' AND column_name = 'accessCount') THEN
        ALTER TABLE "Memory" ADD COLUMN "accessCount" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Memory_userId_idx" ON "Memory"("userId");
CREATE INDEX IF NOT EXISTS "Memory_type_idx" ON "Memory"(type);
CREATE INDEX IF NOT EXISTS "Memory_importance_idx" ON "Memory"(importance);

-- Verify the structure
SELECT 
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- Test with a simple insert
INSERT INTO "Memory" (
    id,
    "userId",
    type,
    content,
    context,
    importance
) VALUES (
    gen_random_uuid()::text,
    'test-user',
    'test',
    'Test memory content',
    'Test context',
    0.5
) ON CONFLICT (id) DO NOTHING;

-- Verify insert worked
SELECT * FROM "Memory" WHERE type = 'test' LIMIT 1;

-- Clean up test record
DELETE FROM "Memory" WHERE type = 'test';

-- Final status
SELECT 
    '✅ Memory table structure fixed!' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'Memory';