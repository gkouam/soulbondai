# Vercel Environment Variables Setup

Add these environment variables in your Vercel project settings:

## Required Variables

### Database
- `DATABASE_URL` - Your PostgreSQL connection string (e.g., from Neon, Supabase, or Railway)

### Authentication
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL (e.g., https://soulbondai.vercel.app)

### AI Services
- `OPENAI_API_KEY` - Your OpenAI API key
- `PINECONE_API_KEY` - Your Pinecone API key
- `PINECONE_ENVIRONMENT` - Your Pinecone environment
- `PINECONE_INDEX` - Your Pinecone index name (e.g., soulbond-memories)

### Payment Processing
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook endpoint secret
- `STRIPE_BASIC_PRICE_ID` - Price ID for Basic plan
- `STRIPE_PREMIUM_PRICE_ID` - Price ID for Premium plan
- `STRIPE_ULTIMATE_PRICE_ID` - Price ID for Ultimate plan
- `STRIPE_LIFETIME_PRICE_ID` - Price ID for Lifetime plan

### Optional Services
- `GOOGLE_CLIENT_ID` - For Google OAuth (optional)
- `GOOGLE_CLIENT_SECRET` - For Google OAuth (optional)
- `REDIS_URL` - Redis connection URL (optional)
- `REDIS_TOKEN` - Redis auth token (optional)

### Email Configuration (optional)
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password
- `EMAIL_FROM` - From email address

## Important Notes

1. **Database**: You'll need to set up a PostgreSQL database. Recommended services:
   - Neon (https://neon.tech) - Serverless Postgres
   - Supabase (https://supabase.com) - Postgres with extras
   - Railway (https://railway.app) - Simple deployment

2. **After deployment**, run database migrations:
   ```bash
   npx prisma db push
   ```

3. **Stripe Webhook**: After deployment, set up your webhook endpoint at:
   ```
   https://your-domain.vercel.app/api/stripe/webhook
   ```

4. **Socket.io**: The WebSocket server needs to be deployed separately (e.g., on Railway or Render)