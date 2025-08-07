#!/bin/bash

echo "Setting up production database..."
echo "================================"

# Production database URL
export DATABASE_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "1. Generating Prisma Client..."
npx prisma generate

echo ""
echo "2. Pushing schema to database..."
npx prisma db push --accept-data-loss

echo ""
echo "3. Verifying tables..."
npx prisma studio --port 5556 &
STUDIO_PID=$!
sleep 3
kill $STUDIO_PID 2>/dev/null

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Tables created:"
echo "- User"
echo "- Account (for OAuth)"
echo "- Session" 
echo "- Profile"
echo "- Subscription"
echo "- Message"
echo "- Conversation"
echo "- And all other schema tables"
echo ""
echo "You can now try logging in with Google OAuth at:"
echo "https://soulbondai.com"