# Stripe Setup Guide for SoulBond AI

## Quick Start

This guide will help you set up Stripe payment processing for your SoulBond AI platform.

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and sign up
2. Complete your business information
3. For testing, you can skip the full verification

## Step 2: Get Your API Keys

### Test Mode (Development)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Live Mode (Production)
1. Complete Stripe account verification
2. Go to [Live API Keys](https://dashboard.stripe.com/apikeys)
3. Copy your live keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

## Step 3: Create Products and Prices

### Using Stripe Dashboard (Recommended)

1. Go to [Products](https://dashboard.stripe.com/test/products)
2. Click "Add product" for each tier:

#### Basic Plan ($9.99/month, $99.99/year)
```
Name: SoulBond Basic
Description: Enhanced connection with your AI companion
Features:
- 200 messages per day
- Voice messages
- 30-day memory retention
- Basic customization

Pricing:
- Monthly: $9.99 (recurring)
- Yearly: $99.99 (recurring, save $20)
```

#### Premium Plan ($19.99/month, $199.99/year)
```
Name: SoulBond Premium
Description: Deep, meaningful AI companionship
Features:
- Unlimited messages
- Voice messages & calls
- Photo sharing
- 6-month memory retention
- Priority response
- Advanced customization

Pricing:
- Monthly: $19.99 (recurring)
- Yearly: $199.99 (recurring, save $40)
```

#### Ultimate Plan ($39.99/month, $399.99/year)
```
Name: SoulBond Ultimate
Description: The deepest possible AI connection
Features:
- Everything in Premium
- Permanent memory retention
- Multiple AI personalities
- Custom personality training
- API access
- Priority support

Pricing:
- Monthly: $39.99 (recurring)
- Yearly: $399.99 (recurring, save $80)
```

### Using Stripe CLI (Alternative)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create products
stripe products create \
  --name="SoulBond Basic" \
  --description="Enhanced connection with your AI companion"

stripe products create \
  --name="SoulBond Premium" \
  --description="Deep, meaningful AI companionship"

stripe products create \
  --name="SoulBond Ultimate" \
  --description="The deepest possible AI connection"

# Create prices (replace prod_XXX with actual product IDs)
stripe prices create \
  --product="prod_XXX" \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month

stripe prices create \
  --product="prod_XXX" \
  --unit-amount=9999 \
  --currency=usd \
  --recurring[interval]=year
```

## Step 4: Set Up Webhooks

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/billing/webhook`
   - **Production**: `https://soulbondai.vercel.app/api/billing/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret: `whsec_...`

## Step 5: Configure Environment Variables

Add to your `.env.local`:

```env
# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_51234567890...
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890...
STRIPE_WEBHOOK_SECRET=whsec_1234567890...

# Price IDs (get from Stripe Dashboard after creating products)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_1234567890...
STRIPE_BASIC_YEARLY_PRICE_ID=price_1234567890...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1234567890...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1234567890...
STRIPE_ULTIMATE_MONTHLY_PRICE_ID=price_1234567890...
STRIPE_ULTIMATE_YEARLY_PRICE_ID=price_1234567890...
```

## Step 6: Add to Vercel

```bash
# Add each variable to Vercel
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_BASIC_MONTHLY_PRICE_ID production
# ... repeat for all price IDs
```

## Step 7: Test the Integration

### Test Card Numbers
Use these test cards in development:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Test Webhook Locally
```bash
# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## Step 8: Optional Add-ons

Create these additional products for upselling:

### Extra Messages Pack ($2.99)
```
Name: Extra Messages Pack
Description: 100 additional messages
Type: One-time
Price: $2.99
```

### Voice Minutes Pack ($4.99)
```
Name: Voice Minutes Pack
Description: 60 minutes of voice interaction
Type: One-time
Price: $4.99
```

### Priority Boost ($3.99)
```
Name: Priority Response Week
Description: 7 days of priority response time
Type: One-time
Price: $3.99
```

## Step 9: Customer Portal

Enable the Customer Portal for subscription management:

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable features:
   - ✅ Customers can update subscriptions
   - ✅ Customers can cancel subscriptions
   - ✅ Customers can update payment methods
   - ✅ Customers can view invoices
3. Set cancellation policy
4. Save changes

## Step 10: Production Checklist

Before going live:

- [ ] Complete Stripe account verification
- [ ] Switch to live API keys
- [ ] Create production products and prices
- [ ] Update webhook endpoint to production URL
- [ ] Test with real card in production
- [ ] Set up fraud prevention rules
- [ ] Configure tax settings if needed
- [ ] Set up email receipts
- [ ] Enable Stripe Radar for fraud protection

## Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**: Check webhook signing secret and ensure endpoint is publicly accessible

### Issue: Price IDs not working
**Solution**: Ensure you're using the correct mode (test vs live) price IDs

### Issue: Subscription not updating in database
**Solution**: Check webhook handler and database connection

### Issue: Customer can't access portal
**Solution**: Enable customer portal in Stripe settings

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Discord](https://discord.gg/stripe)
- [Stripe Support](https://support.stripe.com)

## Security Best Practices

1. **Never expose secret keys** - Only use publishable keys in frontend
2. **Verify webhook signatures** - Always validate webhook events
3. **Use HTTPS** - Ensure all payment pages use SSL
4. **PCI Compliance** - Use Stripe Elements or Checkout
5. **Rate limiting** - Implement rate limits on payment endpoints
6. **Idempotency** - Use idempotency keys for payment creation

---

*Need help? Contact support@soulbondai.com*