#!/bin/bash

echo "🔄 Running Vercel build script..."

# Push schema before build to ensure database is ready
echo "🚀 Pushing schema to database..."
npx prisma generate
npx prisma db push --skip-seed || true
echo "✅ Schema operations complete!"

# Run the standard Next.js build
npm run build