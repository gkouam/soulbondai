# Resend Email Setup Guide

## 1. DNS Records Setup

Add these DNS records to your domain (soulbondai.com):

### MX Record
- **Name**: send
- **Type**: MX
- **Priority**: 10
- **Value**: feedback-smtp.us-east-1.amazonses.com

### SPF Record (TXT)
- **Name**: send
- **Type**: TXT
- **Value**: v=spf1 include:amazonses.com ~all

### DKIM Record (TXT)
- **Name**: resend._domainkey
- **Type**: TXT
- **Value**: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCJVEnaKsRQI6TQiFpVd/koxvUHiZEvkNtpHNLQ3bO+oQM0xxrnjmq2UUnxyxG2QqsV7BmCAYG0HUvGJWgWkEKYngcMzQ0sccUXXiqupNhZbU0lvWfLEGHf0mbcMYlBWVCGuV+eMDl8XKbBk89OHyYvgxEY0Jr+qqBeOIm+mtxwwIDAQAB

### DMARC Record (TXT)
- **Name**: _dmarc
- **Type**: TXT
- **Value**: v=DMARC1; p=none;

## 2. Get Resend API Key

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Copy the API key (starts with `re_`)

## 3. Add to Vercel Environment Variables

Go to: https://vercel.com/gkouams-projects/soulbondai/settings/environment-variables

Add:
```
RESEND_API_KEY = re_xxxxxxxxxx
```

## 4. Update Email From Address

After DNS records are verified (can take 24-48 hours), update the from address in:
- `/lib/email/resend.ts`

Change from:
```typescript
from: options.from || 'SoulBond AI <noreply@soulbondai.com>'
```

To:
```typescript
from: options.from || 'SoulBond AI <noreply@send.soulbondai.com>'
```

## 5. Test Email Sending

Once DNS is verified and API key is added, test with:

1. Password reset flow
2. Welcome emails after registration
3. Subscription confirmation emails

## Email Features in Your App

Your app now supports:
- ✅ Welcome emails after registration
- ✅ Password reset emails
- ✅ Subscription confirmation emails
- ✅ Daily digest emails (optional)
- ✅ Batch email sending

## Notes

- DNS propagation can take 24-48 hours
- Until DNS is verified, emails might go to spam
- Resend provides detailed analytics for email delivery
- Free tier includes 3,000 emails/month