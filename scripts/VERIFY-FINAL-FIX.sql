-- Verify PersonalityTestResult has the correct columns

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PersonalityTestResult'
ORDER BY ordinal_position;

-- The output should show these columns:
-- id
-- userId  
-- answers (NOT traits)
-- scores
-- archetype
-- createdAt
-- completedAt (NOT updatedAt)