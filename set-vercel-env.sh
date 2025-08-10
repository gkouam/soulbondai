#!/bin/bash

# Update DATABASE_URL with proper timeouts
vercel env rm DATABASE_URL production --yes 2>/dev/null || true
echo "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=10&pool_timeout=10" | vercel env add DATABASE_URL production

# Add DIRECT_URL if not exists
vercel env rm DIRECT_URL production --yes 2>/dev/null || true
echo "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" | vercel env add DIRECT_URL production

echo "Environment variables updated successfully"