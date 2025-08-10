-- Check what columns exist in Profile table
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Profile'
ORDER BY ordinal_position;