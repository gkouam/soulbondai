#!/bin/bash
# Quick script to add all required environment variables to Vercel

echo "Adding Pinecone Configuration..."
vercel env add PINECONE_API_KEY production preview development
# When prompted, paste: pcsk_cMNYc_QP44kDroLzvBWJSCJy8K5J1ZBVfKXmKssEAcfwfQy6Z12YDS3qk9EfT9TCki98e

vercel env add PINECONE_INDEX_NAME production preview development
# When prompted, enter: soulbond-memories

vercel env add PINECONE_HOST production preview development
# When prompted, enter: https://soulbond-memories-pex7xp4.svc.aped-4627-b74a.pinecone.io

echo "Adding Stripe Webhook Secret..."
vercel env add STRIPE_WEBHOOK_SECRET production preview development
# When prompted, enter: whsec_2FApc4dSzPpYpTr0kEDOeo1ZOlK0MHJN

echo "Adding Direct Database URL..."
vercel env add DIRECT_URL production preview development
# When prompted, enter: postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

echo "✅ All environment variables added! Now redeploy with: vercel --prod"