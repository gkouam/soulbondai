# Quick Vercel Setup Guide

## 1. Go to your Vercel Dashboard
https://vercel.com/gkouams-projects/soulbondai/settings/environment-variables

## 2. Add these Environment Variables

### Required (Add these first to get basic functionality):

```
DATABASE_URL = postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require

NEXTAUTH_SECRET = [Generate one below]

NEXTAUTH_URL = https://soulbondai.vercel.app
```

### Generate NEXTAUTH_SECRET:
Run this command locally:
```bash
openssl rand -base64 32
```

Or use this example (change it!):
```
NEXTAUTH_SECRET = Kh8Qr7wPm3Zx5Nv2Jt9Fg6Ld4Hs1Yb0We8Uc7Ia5Op3
```

### Optional (Add these later for full functionality):

```
# OpenAI for AI Chat
OPENAI_API_KEY = sk-...

# Stripe for Payments
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
STRIPE_BASIC_PRICE_ID = price_...
STRIPE_PREMIUM_PRICE_ID = price_...
STRIPE_ULTIMATE_PRICE_ID = price_...
STRIPE_LIFETIME_PRICE_ID = price_...

# Pinecone for Memory (optional)
PINECONE_API_KEY = ...
PINECONE_ENVIRONMENT = ...
PINECONE_INDEX = soulbond-memories

# Email (optional)
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = your-app-password
EMAIL_FROM = noreply@soulbondai.com
```

## 3. After Adding Variables

1. Vercel will automatically redeploy
2. Your app will be live at: https://soulbondai.vercel.app
3. Database tables are already created!

## 4. Test Your App

1. Visit: https://soulbondai.vercel.app
2. Click "Start Your Journey"
3. Take the personality test
4. Create an account
5. You'll be able to access the dashboard!

## Note on AI Chat
The chat interface will only work after you add an OpenAI API key. Get one from:
https://platform.openai.com/api-keys