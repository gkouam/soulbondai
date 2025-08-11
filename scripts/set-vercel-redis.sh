#!/bin/bash

# Set Redis environment variables in Vercel
echo "🚀 Setting Redis environment variables in Vercel..."

# Set the Redis variables
vercel env add REDIS_URL production <<< "https://driven-man-26719.upstash.io"
vercel env add REDIS_TOKEN production <<< "AWhfAAIjcDFjYjA4Mjk1ZjIyNzY0NzllYjc3NTZlNjUwYzFiNGRjMnAxMA"
vercel env add UPSTASH_REDIS_REST_URL production <<< "https://driven-man-26719.upstash.io"
vercel env add UPSTASH_REDIS_REST_TOKEN production <<< "AWhfAAIjcDFjYjA4Mjk1ZjIyNzY0NzllYjc3NTZlNjUwYzFiNGRjMnAxMA"
vercel env add REDIS_TTL_SECONDS production <<< "3600"

echo "✅ Redis environment variables added to Vercel!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Check logs: vercel logs"
echo "3. Look for: 'Using Upstash Redis' in the logs"