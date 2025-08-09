-- ========================================
-- SOULBONDAI DATABASE VERIFICATION SCRIPT
-- Run this in Neon SQL Editor to verify schema
-- ========================================

-- 1. CHECK ALL TABLES EXIST
-- ========================================
SELECT '=== CHECKING TABLES ===' as check_type;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'User', 'Profile', 'Subscription', 'Conversation', 'Message',
            'Memory', 'Activity', 'ConversionEvent', 'Payment',
            'PersonalityTestResult', 'Account', 'Session', 'VerificationToken',
            'ConsentRecord', 'PhoneVerification', 'Device', 'AuditLog'
        ) THEN '✅ EXISTS'
        ELSE '❌ UNEXPECTED'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFY MESSAGE TABLE STRUCTURE (Critical Fix)
-- ========================================
SELECT '=== MESSAGE TABLE COLUMNS ===' as check_type;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('audioUrl', 'imageUrl') THEN '✅ CRITICAL COLUMN'
        WHEN column_name IN ('id', 'conversationId', 'role', 'content', 'createdAt') THEN '✅ REQUIRED'
        WHEN column_name = 'metadata' THEN '✅ OPTIONAL'
        ELSE '⚠️ CHECK'
    END as status
FROM information_schema.columns
WHERE table_name = 'Message'
ORDER BY ordinal_position;

-- 3. VERIFY CONVERSATION TABLE STRUCTURE
-- ========================================
SELECT '=== CONVERSATION TABLE COLUMNS ===' as check_type;

SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'archived' THEN '✅ FIXED (was endedAt)'
        WHEN column_name IN ('id', 'userId', 'createdAt', 'updatedAt') THEN '✅ REQUIRED'
        WHEN column_name = 'title' THEN '✅ OPTIONAL'
        ELSE '⚠️ CHECK'
    END as status
FROM information_schema.columns
WHERE table_name = 'Conversation'
ORDER BY ordinal_position;

-- 4. VERIFY PROFILE TABLE STRUCTURE
-- ========================================
SELECT '=== PROFILE TABLE COLUMNS ===' as check_type;

SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'companionVoice' THEN '✅ FIXED (was selectedVoice)'
        WHEN column_name IN ('voiceEnabled', 'autoPlayVoice', 'voiceSpeed') THEN '✅ VOICE SETTINGS'
        WHEN column_name IN ('id', 'userId', 'companionName') THEN '✅ REQUIRED'
        ELSE '✅ OK'
    END as status
FROM information_schema.columns
WHERE table_name = 'Profile'
WHERE column_name IN (
    'companionVoice', 'voiceEnabled', 'autoPlayVoice', 
    'voiceSpeed', 'id', 'userId', 'companionName'
)
ORDER BY ordinal_position;

-- 5. CHECK USER ROLES ENUM
-- ========================================
SELECT '=== USER ROLES ENUM ===' as check_type;

SELECT 
    enumlabel as role_value,
    '✅ EXISTS' as status
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'UserRole'
ORDER BY enumsortorder;

-- 6. CHECK FOREIGN KEY CONSTRAINTS
-- ========================================
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as check_type;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    '✅ LINKED' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('Message', 'Conversation', 'Profile')
ORDER BY tc.table_name, kcu.column_name;

-- 7. CHECK INDEXES
-- ========================================
SELECT '=== INDEXES ===' as check_type;

SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%pkey' THEN '🔑 PRIMARY KEY'
        WHEN indexname LIKE '%idx' THEN '📍 INDEX'
        WHEN indexname LIKE '%unique' THEN '🔒 UNIQUE'
        ELSE '📌 OTHER'
    END as type
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('Message', 'Conversation', 'Profile', 'User')
ORDER BY tablename, indexname;

-- 8. QUICK DATA STATISTICS
-- ========================================
SELECT '=== TABLE STATISTICS ===' as check_type;

SELECT 
    'User' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 
    'Profile', COUNT(*) FROM "Profile"
UNION ALL
SELECT 
    'Conversation', COUNT(*) FROM "Conversation"
UNION ALL
SELECT 
    'Message', COUNT(*) FROM "Message"
UNION ALL
SELECT 
    'Subscription', COUNT(*) FROM "Subscription"
ORDER BY table_name;

-- 9. FINAL VERIFICATION SUMMARY
-- ========================================
SELECT '=== VERIFICATION SUMMARY ===' as check_type;

WITH checks AS (
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Message' 
                AND column_name = 'audioUrl'
            ) THEN '✅ Message.audioUrl exists'
            ELSE '❌ Message.audioUrl MISSING!'
        END as check_1,
        
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Message' 
                AND column_name = 'imageUrl'
            ) THEN '✅ Message.imageUrl exists'
            ELSE '❌ Message.imageUrl MISSING!'
        END as check_2,
        
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Conversation' 
                AND column_name = 'archived'
            ) THEN '✅ Conversation.archived exists'
            ELSE '❌ Conversation.archived MISSING!'
        END as check_3,
        
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Profile' 
                AND column_name = 'companionVoice'
            ) THEN '✅ Profile.companionVoice exists'
            ELSE '❌ Profile.companionVoice MISSING!'
        END as check_4,
        
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Conversation' 
                AND column_name = 'endedAt'
            ) THEN '✅ Conversation.endedAt removed (correct)'
            ELSE '⚠️ Conversation.endedAt still exists (should be removed)'
        END as check_5,
        
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Profile' 
                AND column_name = 'selectedVoice'
            ) THEN '✅ Profile.selectedVoice removed (correct)'
            ELSE '⚠️ Profile.selectedVoice still exists (should be removed)'
        END as check_6
)
SELECT 
    check_1 as "audioUrl Check",
    check_2 as "imageUrl Check",
    check_3 as "archived Check",
    check_4 as "companionVoice Check",
    check_5 as "endedAt Removed",
    check_6 as "selectedVoice Removed"
FROM checks;

-- ========================================
-- EXPECTED RESULTS:
-- All checks should show ✅ 
-- If any show ❌, the schema needs updating
-- ========================================