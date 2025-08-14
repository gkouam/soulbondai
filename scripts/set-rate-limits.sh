#!/bin/bash

# Script to update rate limit environment variables in Vercel
# Usage: ./scripts/set-rate-limits.sh

echo "Setting rate limit environment variables in Vercel..."

# Set higher limits for testing (can be adjusted)
echo "100" | vercel env add RATE_LIMIT_FREE_DAILY production 2>/dev/null || true
echo "500" | vercel env add RATE_LIMIT_BASIC_DAILY production 2>/dev/null || true
echo "1000" | vercel env add RATE_LIMIT_PREMIUM_DAILY production 2>/dev/null || true
echo "2000" | vercel env add RATE_LIMIT_ULTIMATE_DAILY production 2>/dev/null || true

echo "Rate limits updated! The new limits are:"
echo "  Free: 100 messages/day"
echo "  Basic: 500 messages/day"
echo "  Premium: 1000 messages/day"
echo "  Ultimate: 2000 messages/day"
echo ""
echo "Note: You need to redeploy for these changes to take effect."
echo "Run: vercel --prod --force"