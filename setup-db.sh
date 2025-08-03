#!/bin/bash

echo "Setting up database..."

export DATABASE_URL="postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "Generating Prisma client..."
npx prisma generate

echo "Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "Database setup complete!"