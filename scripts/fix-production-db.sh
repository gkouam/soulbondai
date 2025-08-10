#!/bin/bash

echo "🔄 Fixing production database schema..."

# Production database URLs
export DATABASE_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=10&pool_timeout=10"
export DIRECT_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🚀 Pushing schema changes to production database..."
# This will add missing columns without deleting data
npx prisma db push --skip-generate

echo "✅ Production database schema updated!"