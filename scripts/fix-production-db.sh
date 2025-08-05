#!/bin/bash

echo "🔄 Fixing production database schema..."

# Your current production database from Vercel
export DATABASE_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🚀 Pushing schema to production database..."
npx prisma db push --accept-data-loss

echo "✅ Production database schema updated!"