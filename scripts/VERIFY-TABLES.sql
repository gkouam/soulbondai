-- Verify the tables were created successfully

-- 1. Check PersonalityTestResult table and its columns
SELECT 'PersonalityTestResult columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult'
ORDER BY ordinal_position;

-- 2. Check ConsentRecord table and its columns  
SELECT 'ConsentRecord columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ConsentRecord'  
ORDER BY ordinal_position;

-- 3. Check Profile table has nickname column
SELECT 'Profile nickname check:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Profile' 
AND column_name = 'nickname';

-- 4. List all tables to confirm they exist
SELECT 'All tables in database:' as info;
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. Count of each table
SELECT 'Table counts:' as info;
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 
    'Profile' as table_name, COUNT(*) as count FROM "Profile"
UNION ALL
SELECT 
    'PersonalityTestResult' as table_name, COUNT(*) as count FROM "PersonalityTestResult"
UNION ALL
SELECT 
    'ConsentRecord' as table_name, COUNT(*) as count FROM "ConsentRecord";

-- Success message
SELECT '✅ Verification complete!' as status;