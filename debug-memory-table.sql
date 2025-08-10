-- ========================================
-- DEBUG MEMORY TABLE ISSUES
-- ========================================

-- 1. First, check if Memory table exists at all
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'Memory'
) as memory_table_exists;

-- 2. Show EXACT column names (case-sensitive)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- 3. Count records in Memory table
SELECT COUNT(*) as memory_record_count FROM "Memory";

-- 4. Try a simple select without specific columns
SELECT * FROM "Memory" LIMIT 1;

-- 5. Check if the issue is with column names (case sensitivity)
SELECT 
    CASE 
        WHEN column_name = 'userId' THEN 'userId (camelCase)'
        WHEN column_name = 'userid' THEN 'userid (lowercase)' 
        WHEN column_name = 'user_id' THEN 'user_id (snake_case)'
        ELSE column_name
    END as column_style,
    column_name as actual_name
FROM information_schema.columns
WHERE table_name = 'Memory'
AND lower(column_name) LIKE '%user%';

-- 6. Get the EXACT DDL of the Memory table
SELECT 
    'CREATE TABLE "Memory" (' || E'\n' ||
    string_agg(
        '    "' || column_name || '" ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        E',\n' ORDER BY ordinal_position
    ) || E'\n);' as table_ddl
FROM information_schema.columns
WHERE table_name = 'Memory'
GROUP BY table_name;