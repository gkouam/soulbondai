-- Check if Message table has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'Message'
ORDER BY 
    ordinal_position;