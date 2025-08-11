#!/bin/bash

# Push schema to Neon database
echo "🚀 Pushing schema to Neon database..."

# Export the Neon database URLs
export DATABASE_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "✅ Schema pushed successfully!"

# Optional: Seed initial data
echo "Creating initial admin user..."
npx prisma db execute --file scripts/seed-admin.sql 2>/dev/null || echo "Admin might already exist"

echo "✅ Database setup complete!"