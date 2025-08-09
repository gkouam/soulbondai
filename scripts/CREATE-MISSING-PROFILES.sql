-- Create Profile records for users who don't have one

-- First, check which users don't have profiles
SELECT 'Users without profiles:' as info;
SELECT u.id, u.email, u.name 
FROM "User" u 
LEFT JOIN "Profile" p ON u.id = p."userId"
WHERE p.id IS NULL;

-- Create profiles for all users who don't have one
INSERT INTO "Profile" (
    "id",
    "userId",
    "trustLevel",
    "interactionCount",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    u.id,
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u
LEFT JOIN "Profile" p ON u.id = p."userId"
WHERE p.id IS NULL;

-- Verify all users now have profiles
SELECT 'Users with profiles after fix:' as info;
SELECT COUNT(*) as users_count FROM "User";
SELECT COUNT(*) as profiles_count FROM "Profile";

-- List all profiles
SELECT 'All profiles:' as info;
SELECT p.id, p."userId", u.email, p."archetype", p."createdAt"
FROM "Profile" p
JOIN "User" u ON p."userId" = u.id
ORDER BY p."createdAt" DESC;

SELECT '✅ Missing profiles created!' as status;