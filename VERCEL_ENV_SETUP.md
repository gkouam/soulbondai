# Vercel Environment Variables Setup

You need to add the following environment variable to your Vercel project:

## DIRECT_URL
This is required for Prisma migrations and schema pushes.

**Variable Name:** `DIRECT_URL`
**Value:** `postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`

Note: The DIRECT_URL uses the direct connection (without `-pooler` in the hostname) while DATABASE_URL uses the pooled connection.

## How to add:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the DIRECT_URL variable with the value above
4. Make sure it's available in all environments (Production, Preview, Development)
5. Redeploy your application

This will ensure Prisma can properly manage your database schema.