-- ========================================
-- SoulBond AI Database Verification Script
-- Run these queries in Neon SQL Editor
-- ========================================

-- 1. CHECK IF MEMORY.CONTEXT COLUMN EXISTS (CRITICAL FIX)
-- This should return the column details if it exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Memory' 
    AND column_name = 'context';

-- 2. VIEW ALL COLUMNS IN MEMORY TABLE
-- This shows the complete structure of the Memory table
SELECT 
    ordinal_position,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Memory'
ORDER BY ordinal_position;

-- 3. LIST ALL TABLES IN DATABASE
-- Verify all required tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 4. TEST MEMORY TABLE QUERY
-- This will fail if context column doesn't exist
SELECT 
    id,
    userId,
    type,
    content,
    context,  -- This column was missing
    importance,
    createdAt
FROM "Memory"
LIMIT 5;

-- 5. CHECK PROFILE TABLE STRUCTURE
-- Verify all required columns exist
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'Profile'
    AND column_name IN (
        'id', 'userId', 'archetype', 'nickname', 
        'messageCount', 'messagesUsedToday', 
        'trustLevel', 'lastMessageReset'
    )
ORDER BY ordinal_position;

-- 6. COUNT RECORDS IN MAIN TABLES
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Profile', COUNT(*) FROM "Profile"
UNION ALL
SELECT 'Conversation', COUNT(*) FROM "Conversation"
UNION ALL
SELECT 'Message', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Memory', COUNT(*) FROM "Memory"
UNION ALL
SELECT 'Subscription', COUNT(*) FROM "Subscription"
UNION ALL
SELECT 'Activity', COUNT(*) FROM "Activity"
ORDER BY table_name;

-- 7. VERIFY CRITICAL COLUMNS EXIST
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Memory' AND column_name = 'context'
        ) 
        THEN '✅ Memory.context EXISTS' 
        ELSE '❌ Memory.context MISSING - RUN SCHEMA UPDATE!' 
    END as memory_context_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Memory' AND column_name = 'embedding'
        ) 
        THEN '✅ Memory.embedding EXISTS' 
        ELSE '❌ Memory.embedding MISSING' 
    END as memory_embedding_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Profile' AND column_name = 'messagesUsedToday'
        ) 
        THEN '✅ Profile.messagesUsedToday EXISTS' 
        ELSE '❌ Profile.messagesUsedToday MISSING' 
    END as profile_messages_status;

-- 8. IF MEMORY.CONTEXT IS MISSING, RUN THIS TO ADD IT:
-- (Only run if the column doesn't exist)
/*
ALTER TABLE "Memory" 
ADD COLUMN IF NOT EXISTS context TEXT;
*/

-- 9. CHECK DATABASE VERSION AND CONNECTION
SELECT 
    current_database() as database,
    current_user as user,
    version() as postgres_version,
    now() as current_time;

-- 10. SIMPLE HEALTH CHECK
-- If this returns 'OK', the basic schema is working
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM "User" LIMIT 1) OR NOT EXISTS (SELECT 1 FROM "User" LIMIT 1)
        THEN 'OK - Database is accessible'
        ELSE 'ERROR - Cannot access tables'
    END as health_status;