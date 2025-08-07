#!/bin/bash

# SoulBond AI - Service Setup Script
# This script helps you set up all required external services

echo "========================================"
echo "  SoulBond AI - Service Setup Helper"
echo "========================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    print_status "Created .env.local from template"
else
    print_warning ".env.local already exists"
fi

echo ""
echo "Let's set up your services step by step:"
echo ""

# Function to update env variable
update_env() {
    local key=$1
    local value=$2
    if grep -q "^$key=" .env.local; then
        sed -i.bak "s|^$key=.*|$key=$value|" .env.local
    else
        echo "$key=$value" >> .env.local
    fi
}

# 1. Database URL (Already provided)
echo "1. DATABASE SETUP"
echo "-----------------"
echo "Your Neon database URL has been provided:"
echo "postgresql://neondb_owner:npg_1XZQ2KDwoIlT@ep-withered-math-ae5wet7s-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
print_status "Database configured"
echo ""

# 2. Generate NextAuth Secret
echo "2. NEXTAUTH SECRET"
echo "------------------"
if command -v openssl &> /dev/null; then
    NEW_SECRET=$(openssl rand -base64 32)
    update_env "NEXTAUTH_SECRET" "$NEW_SECRET"
    print_status "Generated new NextAuth secret"
else
    print_warning "OpenSSL not found. Please generate manually with: openssl rand -base64 32"
fi
echo ""

# 3. Stripe Setup
echo "3. STRIPE SETUP"
echo "---------------"
echo "Please follow these steps:"
echo "1. Go to https://dashboard.stripe.com/test/apikeys"
echo "2. Copy your test keys"
echo ""
read -p "Enter your Stripe Secret Key (sk_test_...): " STRIPE_SECRET
if [ ! -z "$STRIPE_SECRET" ]; then
    update_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET"
    print_status "Stripe secret key saved"
fi

read -p "Enter your Stripe Publishable Key (pk_test_...): " STRIPE_PUB
if [ ! -z "$STRIPE_PUB" ]; then
    update_env "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUB"
    print_status "Stripe publishable key saved"
fi
echo ""

# 4. Create Stripe Products
echo "4. STRIPE PRODUCTS"
echo "------------------"
echo "Now create products in Stripe Dashboard:"
echo "https://dashboard.stripe.com/test/products"
echo ""
echo "Create these 3 products:"
echo "- Basic Plan (\$9.99/month, \$99.99/year)"
echo "- Premium Plan (\$19.99/month, \$199.99/year)"
echo "- Ultimate Plan (\$39.99/month, \$399.99/year)"
echo ""
read -p "Press Enter after creating products..."
echo ""

echo "Enter the Price IDs from Stripe Dashboard:"
read -p "Basic Monthly Price ID: " BASIC_MONTHLY
if [ ! -z "$BASIC_MONTHLY" ]; then
    update_env "STRIPE_BASIC_MONTHLY_PRICE_ID" "$BASIC_MONTHLY"
fi

read -p "Basic Yearly Price ID: " BASIC_YEARLY
if [ ! -z "$BASIC_YEARLY" ]; then
    update_env "STRIPE_BASIC_YEARLY_PRICE_ID" "$BASIC_YEARLY"
fi

read -p "Premium Monthly Price ID: " PREMIUM_MONTHLY
if [ ! -z "$PREMIUM_MONTHLY" ]; then
    update_env "STRIPE_PREMIUM_MONTHLY_PRICE_ID" "$PREMIUM_MONTHLY"
fi

read -p "Premium Yearly Price ID: " PREMIUM_YEARLY
if [ ! -z "$PREMIUM_YEARLY" ]; then
    update_env "STRIPE_PREMIUM_YEARLY_PRICE_ID" "$PREMIUM_YEARLY"
fi

read -p "Ultimate Monthly Price ID: " ULTIMATE_MONTHLY
if [ ! -z "$ULTIMATE_MONTHLY" ]; then
    update_env "STRIPE_ULTIMATE_MONTHLY_PRICE_ID" "$ULTIMATE_MONTHLY"
fi

read -p "Ultimate Yearly Price ID: " ULTIMATE_YEARLY
if [ ! -z "$ULTIMATE_YEARLY" ]; then
    update_env "STRIPE_ULTIMATE_YEARLY_PRICE_ID" "$ULTIMATE_YEARLY"
fi

print_status "Stripe products configured"
echo ""

# 5. Webhook Setup
echo "5. STRIPE WEBHOOKS"
echo "------------------"
echo "Add webhook endpoint in Stripe Dashboard:"
echo "https://dashboard.stripe.com/test/webhooks"
echo ""
echo "Endpoint URL: https://soulbondai.vercel.app/api/billing/webhook"
echo "Events: checkout.session.completed, customer.subscription.*, invoice.payment_*"
echo ""
read -p "Enter Webhook Signing Secret (whsec_...): " WEBHOOK_SECRET
if [ ! -z "$WEBHOOK_SECRET" ]; then
    update_env "STRIPE_WEBHOOK_SECRET" "$WEBHOOK_SECRET"
    print_status "Webhook secret saved"
fi
echo ""

# 6. ElevenLabs Setup
echo "6. ELEVENLABS SETUP (Optional)"
echo "-------------------------------"
echo "For voice synthesis, sign up at: https://elevenlabs.io/"
read -p "Enter ElevenLabs API Key (or press Enter to skip): " ELEVENLABS_KEY
if [ ! -z "$ELEVENLABS_KEY" ]; then
    update_env "ELEVENLABS_API_KEY" "$ELEVENLABS_KEY"
    print_status "ElevenLabs configured"
fi
echo ""

# 7. Pinecone Setup
echo "7. PINECONE SETUP (Optional)"
echo "----------------------------"
echo "For memory storage, sign up at: https://www.pinecone.io/"
read -p "Enter Pinecone API Key (or press Enter to skip): " PINECONE_KEY
if [ ! -z "$PINECONE_KEY" ]; then
    update_env "PINECONE_API_KEY" "$PINECONE_KEY"
    read -p "Enter Pinecone Environment (e.g., us-east-1): " PINECONE_ENV
    update_env "PINECONE_ENVIRONMENT" "$PINECONE_ENV"
    update_env "PINECONE_INDEX_NAME" "soulbond-memories"
    print_status "Pinecone configured"
fi
echo ""

# 8. Redis Setup
echo "8. REDIS SETUP (Optional)"
echo "-------------------------"
echo "For caching, use Upstash: https://upstash.com/"
read -p "Enter Redis URL (or press Enter to skip): " REDIS_URL
if [ ! -z "$REDIS_URL" ]; then
    update_env "REDIS_URL" "$REDIS_URL"
    print_status "Redis configured"
fi
echo ""

# 9. Image Storage
echo "9. IMAGE STORAGE (Choose one)"
echo "-----------------------------"
echo "1. Vercel Blob Storage (Recommended)"
echo "2. AWS S3"
echo "3. Cloudinary"
echo "4. Skip"
read -p "Choose option (1-4): " STORAGE_OPTION

case $STORAGE_OPTION in
    1)
        echo "Get token from: https://vercel.com/dashboard/stores"
        read -p "Enter Blob Storage Token: " BLOB_TOKEN
        if [ ! -z "$BLOB_TOKEN" ]; then
            update_env "BLOB_READ_WRITE_TOKEN" "$BLOB_TOKEN"
            print_status "Vercel Blob Storage configured"
        fi
        ;;
    2)
        read -p "Enter AWS Access Key ID: " AWS_KEY
        read -p "Enter AWS Secret Access Key: " AWS_SECRET
        read -p "Enter S3 Bucket Name: " S3_BUCKET
        if [ ! -z "$AWS_KEY" ]; then
            update_env "AWS_ACCESS_KEY_ID" "$AWS_KEY"
            update_env "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET"
            update_env "AWS_S3_BUCKET" "$S3_BUCKET"
            print_status "AWS S3 configured"
        fi
        ;;
    3)
        read -p "Enter Cloudinary Cloud Name: " CLOUD_NAME
        read -p "Enter Cloudinary API Key: " CLOUD_KEY
        read -p "Enter Cloudinary API Secret: " CLOUD_SECRET
        if [ ! -z "$CLOUD_NAME" ]; then
            update_env "CLOUDINARY_CLOUD_NAME" "$CLOUD_NAME"
            update_env "CLOUDINARY_API_KEY" "$CLOUD_KEY"
            update_env "CLOUDINARY_API_SECRET" "$CLOUD_SECRET"
            print_status "Cloudinary configured"
        fi
        ;;
    *)
        print_warning "Skipping image storage setup"
        ;;
esac
echo ""

# Summary
echo "========================================"
echo "           SETUP COMPLETE!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review your .env.local file"
echo "2. Run database migrations: npm run db:push"
echo "3. Start development server: npm run dev"
echo "4. Test Stripe webhook: stripe listen --forward-to localhost:3000/api/billing/webhook"
echo ""
echo "For production deployment:"
echo "1. Add all environment variables to Vercel"
echo "2. Update NEXTAUTH_URL to your production domain"
echo "3. Switch to Stripe live keys"
echo "4. Configure production database"
echo ""
print_status "Setup script completed!"