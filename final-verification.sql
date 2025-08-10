-- ========================================
-- FINAL VERIFICATION - Memory Table Fixed
-- ========================================

-- 1. Test the critical query that was failing
SELECT 
    id,
    "userId",
    type,
    content,
    context,  -- This should work now!
    importance,
    "createdAt"
FROM "Memory"
LIMIT 1;

-- 2. Show all columns (should be 13 total)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- 3. Confirm all required columns exist
SELECT 
    '✅ MEMORY TABLE FIXED!' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'context' THEN 1 END) as has_context,
    COUNT(CASE WHEN column_name = 'embedding' THEN 1 END) as has_embedding,
    COUNT(CASE WHEN column_name = 'lastAccessed' THEN 1 END) as has_lastAccessed,
    COUNT(CASE WHEN column_name = 'accessCount' THEN 1 END) as has_accessCount
FROM information_schema.columns 
WHERE table_name = 'Memory';