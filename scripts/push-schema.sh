#!/bin/bash

# Exit on any error
set -e

echo "🔄 Pushing Prisma schema to production database..."

# Set the database URL
export DATABASE_URL="postgresql://neondb_owner:npg_gN7AL1hGioIS@ep-divine-butterfly-aefwoivc-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL=$DATABASE_URL

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push the schema
echo "🚀 Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "✅ Schema push complete!"

# Verify tables
echo "🔍 Verifying tables..."
npx prisma db pull

echo "✅ All done!"