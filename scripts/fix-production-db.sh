#!/bin/bash

echo "🔄 Fixing production database schema..."

# Your current production database from Vercel (with channel_binding as shown in your env)
export DATABASE_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DIRECT_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🚀 Pushing schema to production database..."
npx prisma db push --force-reset --accept-data-loss

echo "✅ Production database schema updated!"