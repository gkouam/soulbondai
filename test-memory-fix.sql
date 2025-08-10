-- ========================================
-- VERIFY MEMORY TABLE FIX
-- Run this to confirm the fix worked
-- ========================================

-- 1. Check if context column now exists
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'Memory' 
    AND column_name = 'context';

-- 2. List all Memory table columns
SELECT 
    ordinal_position,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- 3. Test query with context column (this should work now!)
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

-- 4. Final verification
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Memory' AND column_name = 'context'
        ) 
        THEN '✅ SUCCESS: Memory.context column EXISTS!' 
        ELSE '❌ ERROR: Memory.context column still MISSING' 
    END as fix_status;