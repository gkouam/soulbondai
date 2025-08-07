#!/bin/bash

# SoulBond AI - Vercel Deployment Script
# This script helps deploy and configure the app on Vercel

echo "========================================"
echo "   SoulBond AI - Vercel Deployment"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm i -g vercel
    print_status "Vercel CLI installed"
fi

echo "Step 1: Login to Vercel"
echo "-----------------------"
vercel login
echo ""

echo "Step 2: Link Project"
echo "-------------------"
vercel link
echo ""

echo "Step 3: Add Environment Variables"
echo "---------------------------------"
echo "Adding production environment variables to Vercel..."
echo ""

# Function to add env var to Vercel
add_env_var() {
    local key=$1
    local production=$2
    
    if [ "$production" = "true" ]; then
        echo "$key" | vercel env add production
    else
        echo "$key" | vercel env add development preview production
    fi
}

# Read from .env.local if it exists
if [ -f .env.local ]; then
    print_status "Found .env.local file"
    echo ""
    echo "Do you want to upload environment variables from .env.local?"
    read -p "This will add them to Vercel (y/n): " UPLOAD_ENV
    
    if [ "$UPLOAD_ENV" = "y" ]; then
        # Critical production variables
        echo "Adding production variables..."
        
        # Database
        vercel env add DATABASE_URL production < <(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2-)
        
        # NextAuth
        vercel env add NEXTAUTH_SECRET production < <(grep "^NEXTAUTH_SECRET=" .env.local | cut -d '=' -f2-)
        echo "https://soulbondai.vercel.app" | vercel env add NEXTAUTH_URL production
        
        # Google OAuth
        vercel env add GOOGLE_CLIENT_ID production < <(grep "^GOOGLE_CLIENT_ID=" .env.local | cut -d '=' -f2-)
        vercel env add GOOGLE_CLIENT_SECRET production < <(grep "^GOOGLE_CLIENT_SECRET=" .env.local | cut -d '=' -f2-)
        
        # OpenAI
        vercel env add OPENAI_API_KEY production < <(grep "^OPENAI_API_KEY=" .env.local | cut -d '=' -f2-)
        
        # Resend
        vercel env add RESEND_API_KEY production < <(grep "^RESEND_API_KEY=" .env.local | cut -d '=' -f2-)
        
        # Stripe (ask for production keys)
        echo ""
        echo "For Stripe, you need PRODUCTION keys (not test keys)"
        read -p "Enter PRODUCTION Stripe Secret Key (sk_live_...): " STRIPE_LIVE_SECRET
        if [ ! -z "$STRIPE_LIVE_SECRET" ]; then
            echo "$STRIPE_LIVE_SECRET" | vercel env add STRIPE_SECRET_KEY production
        fi
        
        read -p "Enter PRODUCTION Stripe Publishable Key (pk_live_...): " STRIPE_LIVE_PUB
        if [ ! -z "$STRIPE_LIVE_PUB" ]; then
            echo "$STRIPE_LIVE_PUB" | vercel env add STRIPE_PUBLISHABLE_KEY production
        fi
        
        # Webhook secret will be different for production
        echo ""
        echo "You'll need to create a new webhook for production:"
        echo "1. Go to https://dashboard.stripe.com/webhooks"
        echo "2. Add endpoint: https://soulbondai.vercel.app/api/billing/webhook"
        echo "3. Copy the signing secret"
        read -p "Enter Production Webhook Secret (whsec_...): " WEBHOOK_PROD
        if [ ! -z "$WEBHOOK_PROD" ]; then
            echo "$WEBHOOK_PROD" | vercel env add STRIPE_WEBHOOK_SECRET production
        fi
        
        # Price IDs
        echo ""
        echo "Adding Stripe Price IDs..."
        vercel env add STRIPE_BASIC_MONTHLY_PRICE_ID production < <(grep "^STRIPE_BASIC_MONTHLY_PRICE_ID=" .env.local | cut -d '=' -f2-)
        vercel env add STRIPE_BASIC_YEARLY_PRICE_ID production < <(grep "^STRIPE_BASIC_YEARLY_PRICE_ID=" .env.local | cut -d '=' -f2-)
        vercel env add STRIPE_PREMIUM_MONTHLY_PRICE_ID production < <(grep "^STRIPE_PREMIUM_MONTHLY_PRICE_ID=" .env.local | cut -d '=' -f2-)
        vercel env add STRIPE_PREMIUM_YEARLY_PRICE_ID production < <(grep "^STRIPE_PREMIUM_YEARLY_PRICE_ID=" .env.local | cut -d '=' -f2-)
        vercel env add STRIPE_ULTIMATE_MONTHLY_PRICE_ID production < <(grep "^STRIPE_ULTIMATE_MONTHLY_PRICE_ID=" .env.local | cut -d '=' -f2-)
        vercel env add STRIPE_ULTIMATE_YEARLY_PRICE_ID production < <(grep "^STRIPE_ULTIMATE_YEARLY_PRICE_ID=" .env.local | cut -d '=' -f2-)
        
        # Optional services
        if grep -q "^ELEVENLABS_API_KEY=." .env.local; then
            echo "Adding ElevenLabs configuration..."
            vercel env add ELEVENLABS_API_KEY production < <(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d '=' -f2-)
        fi
        
        if grep -q "^PINECONE_API_KEY=." .env.local; then
            echo "Adding Pinecone configuration..."
            vercel env add PINECONE_API_KEY production < <(grep "^PINECONE_API_KEY=" .env.local | cut -d '=' -f2-)
            vercel env add PINECONE_ENVIRONMENT production < <(grep "^PINECONE_ENVIRONMENT=" .env.local | cut -d '=' -f2-)
            vercel env add PINECONE_INDEX_NAME production < <(grep "^PINECONE_INDEX_NAME=" .env.local | cut -d '=' -f2-)
        fi
        
        if grep -q "^REDIS_URL=." .env.local; then
            echo "Adding Redis configuration..."
            vercel env add REDIS_URL production < <(grep "^REDIS_URL=" .env.local | cut -d '=' -f2-)
        fi
        
        if grep -q "^BLOB_READ_WRITE_TOKEN=." .env.local; then
            echo "Adding Vercel Blob Storage..."
            vercel env add BLOB_READ_WRITE_TOKEN production < <(grep "^BLOB_READ_WRITE_TOKEN=" .env.local | cut -d '=' -f2-)
        fi
        
        print_status "Environment variables added to Vercel"
    fi
else
    print_warning ".env.local not found. Please add environment variables manually in Vercel dashboard"
fi

echo ""
echo "Step 4: Deploy to Production"
echo "---------------------------"
read -p "Deploy to production now? (y/n): " DEPLOY_NOW

if [ "$DEPLOY_NOW" = "y" ]; then
    echo "Deploying to production..."
    vercel --prod
    print_status "Deployment initiated"
else
    echo "You can deploy later with: vercel --prod"
fi

echo ""
echo "Step 5: Post-Deployment Tasks"
echo "-----------------------------"
echo ""
echo "After deployment, complete these tasks:"
echo ""
echo "1. ✅ Verify deployment at: https://soulbondai.vercel.app"
echo "2. ✅ Test Google OAuth login"
echo "3. ✅ Run database migrations if needed"
echo "4. ✅ Test Stripe checkout flow"
echo "5. ✅ Configure custom domain (if applicable)"
echo "6. ✅ Set up monitoring and analytics"
echo "7. ✅ Enable Vercel Analytics"
echo "8. ✅ Configure Vercel Speed Insights"
echo ""

echo "Step 6: Custom Domain (Optional)"
echo "--------------------------------"
read -p "Do you have a custom domain? (y/n): " HAS_DOMAIN

if [ "$HAS_DOMAIN" = "y" ]; then
    read -p "Enter your domain (e.g., soulbondai.com): " CUSTOM_DOMAIN
    echo ""
    echo "To add your domain:"
    echo "1. Go to: https://vercel.com/dashboard/domains"
    echo "2. Add domain: $CUSTOM_DOMAIN"
    echo "3. Update DNS records as instructed"
    echo "4. Update NEXTAUTH_URL environment variable to: https://$CUSTOM_DOMAIN"
    echo ""
    vercel domains add "$CUSTOM_DOMAIN"
fi

echo ""
echo "========================================"
echo "        DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Your app should be live at:"
echo "🌐 https://soulbondai.vercel.app"
echo ""
echo "Vercel Dashboard:"
echo "📊 https://vercel.com/dashboard"
echo ""
echo "Important reminders:"
echo "- Ensure all production API keys are set"
echo "- Test the complete user flow"
echo "- Monitor error logs in Vercel"
echo "- Set up alerts for failed payments"
echo ""
print_status "Deployment script completed!"