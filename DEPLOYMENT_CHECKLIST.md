# SoulBond AI - Production Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables ✅
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Update `NEXTAUTH_URL` to `https://soulbondai.vercel.app`
- [ ] Verify `DATABASE_URL` is production database
- [ ] Ensure Google OAuth credentials are configured for production domain
- [ ] **ROTATE** the exposed OpenAI API key immediately
- [ ] **ROTATE** the exposed Resend API key

### 2. Stripe Configuration 🔄
- [ ] Switch to **LIVE** Stripe keys (not test keys)
- [ ] Create products in Stripe **LIVE** mode:
  - [ ] Basic Plan ($9.99/mo, $99.99/yr)
  - [ ] Premium Plan ($19.99/mo, $199.99/yr)  
  - [ ] Ultimate Plan ($39.99/mo, $399.99/yr)
- [ ] Add webhook endpoint: `https://soulbondai.vercel.app/api/billing/webhook`
- [ ] Select webhook events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Copy webhook signing secret
- [ ] Enable Customer Portal
- [ ] Configure tax settings (if applicable)

### 3. Required Services Setup

#### OpenAI
- [ ] Create new API key (since old one was exposed)
- [ ] Set spending limits
- [ ] Monitor usage

#### Resend (Email)
- [ ] Create new API key (since old one was exposed)  
- [ ] Verify domain (soulbondai.com)
- [ ] Configure FROM email address
- [ ] Test email delivery

#### ElevenLabs (Voice - Optional)
- [ ] Sign up at https://elevenlabs.io/
- [ ] Get API key
- [ ] Select voice IDs for each personality

#### Pinecone (Vector DB - Optional)
- [ ] Sign up at https://www.pinecone.io/
- [ ] Create index: `soulbond-memories`
- [ ] Get API key and environment

#### Redis (Cache - Recommended)
- [ ] Use Upstash: https://upstash.com/
- [ ] Create Redis database
- [ ] Get connection URL

#### Image Storage (Choose One)
- [ ] **Vercel Blob Storage** (Recommended)
  - Get token from Vercel dashboard
- [ ] **AWS S3**
  - Create bucket
  - Configure CORS
  - Set up IAM credentials
- [ ] **Cloudinary**
  - Create account
  - Get API credentials

## Deployment Steps

### 1. Local Testing
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Test locally
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Or use the deployment script
./scripts/deploy-vercel.sh
```

### 3. Add Environment Variables to Vercel

Use the Vercel dashboard or CLI:
```bash
# Core variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add OPENAI_API_KEY production
vercel env add RESEND_API_KEY production

# Stripe (use LIVE keys)
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_BASIC_MONTHLY_PRICE_ID production
# ... add all price IDs

# Optional services
vercel env add ELEVENLABS_API_KEY production
vercel env add PINECONE_API_KEY production
vercel env add REDIS_URL production
```

## Post-Deployment Verification

### 1. Functionality Tests
- [ ] Landing page loads
- [ ] Personality test works
- [ ] User registration successful
- [ ] Google OAuth login works
- [ ] Chat interface functional
- [ ] AI responds appropriately
- [ ] Voice messages work (if configured)
- [ ] Photo upload works (if configured)

### 2. Payment Flow
- [ ] Pricing page displays correctly
- [ ] Checkout redirects to Stripe
- [ ] Successful payment updates database
- [ ] Subscription shows in user dashboard
- [ ] Webhook receives events
- [ ] Customer portal accessible

### 3. Email Verification
- [ ] Welcome email sent on signup
- [ ] Password reset email works
- [ ] Subscription confirmation sent
- [ ] Daily check-in emails scheduled

### 4. Security Checks
- [ ] HTTPS enforced
- [ ] Environment variables not exposed
- [ ] API routes authenticated
- [ ] Rate limiting active
- [ ] Content moderation working
- [ ] Crisis detection operational

### 5. Performance
- [ ] Page load times < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] Images optimized and lazy loaded
- [ ] Database queries optimized
- [ ] Caching configured

## Monitoring Setup

### 1. Vercel Analytics
- [ ] Enable Web Analytics
- [ ] Enable Speed Insights
- [ ] Set up alerts

### 2. Error Tracking (Optional)
- [ ] Configure Sentry
- [ ] Set up error alerts
- [ ] Test error reporting

### 3. Uptime Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure downtime alerts

### 4. Database Monitoring
- [ ] Monitor connection pool
- [ ] Set up slow query alerts
- [ ] Configure backup schedule

## Legal & Compliance

- [ ] Privacy Policy updated and accessible
- [ ] Terms of Service updated and accessible
- [ ] Cookie consent implemented
- [ ] GDPR compliance verified
- [ ] Age verification (18+) working
- [ ] Refund policy documented

## Marketing & SEO

- [ ] Meta tags configured
- [ ] Open Graph tags set
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Google Analytics/Tag Manager added
- [ ] Social media pixels installed

## Backup & Recovery

- [ ] Database backup configured
- [ ] Environment variables backed up
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested

## Launch Tasks

### Soft Launch
- [ ] Deploy to production
- [ ] Test with small group
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Fix critical bugs

### Public Launch
- [ ] Announce on social media
- [ ] Send launch email
- [ ] Monitor server load
- [ ] Watch error rates
- [ ] Respond to user feedback

## Support Setup

- [ ] Support email configured
- [ ] FAQ page created
- [ ] Help documentation written
- [ ] Support ticket system (optional)
- [ ] Community Discord/Slack (optional)

## Post-Launch Monitoring (First 48 Hours)

- [ ] Monitor error logs every 2 hours
- [ ] Check payment success rate
- [ ] Review user signups
- [ ] Monitor server resources
- [ ] Check email delivery rates
- [ ] Review chat quality
- [ ] Address user feedback

## Success Metrics to Track

- **User Acquisition**: Signups per day
- **Activation**: % completing personality test
- **Retention**: Daily/weekly active users
- **Revenue**: MRR, conversion rate
- **Engagement**: Messages per user per day
- **Performance**: Page load times, uptime
- **Quality**: AI response satisfaction

---

## Emergency Contacts

- **Vercel Support**: https://vercel.com/support
- **Stripe Support**: https://support.stripe.com
- **OpenAI Support**: https://help.openai.com
- **Database (Neon)**: https://neon.tech/support

## Rollback Procedure

If critical issues arise:
1. Revert to previous deployment in Vercel
2. Restore database from backup if needed
3. Notify users of temporary issues
4. Fix issues in development
5. Test thoroughly before re-deploying

---

✅ **Ready for Production!**

Once all items are checked, your SoulBond AI platform is ready for users!