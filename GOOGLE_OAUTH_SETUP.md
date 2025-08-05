# Google OAuth Setup Guide for SoulBond AI

## Overview
This guide provides step-by-step instructions to properly configure Google OAuth for the SoulBond AI application.

## Prerequisites
- Google Cloud Console account
- Access to Vercel environment variables
- Domain: `soulbondai.vercel.app`

## Step 1: Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**

## Step 2: Configure OAuth Consent Screen

1. Click on **OAuth consent screen** in the sidebar
2. Select **External** user type
3. Fill in the required information:
   - App name: **SoulBond AI**
   - User support email: Your email
   - Application home page: `https://soulbondai.vercel.app`
   - Application privacy policy: `https://soulbondai.vercel.app/privacy`
   - Application terms of service: `https://soulbondai.vercel.app/terms`
   - Authorized domains: `soulbondai.vercel.app`
   - Developer contact information: Your email

4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

5. Add test users if in development

## Step 3: Create OAuth 2.0 Client ID

1. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
2. Select **Web application**
3. Name: **SoulBond AI Web Client**
4. Add Authorized JavaScript origins:
   ```
   https://soulbondai.vercel.app
   http://localhost:3000
   ```
5. Add Authorized redirect URIs:
   ```
   https://soulbondai.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
6. Click **Create**
7. Save the **Client ID** and **Client Secret**

## Step 4: Configure Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables for all environments:

```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=https://soulbondai.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 5: Update Local Development Environment

Create or update `.env.local`:
```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
```

## Step 6: Test the Configuration

1. **Local Testing:**
   - Run `npm run dev`
   - Go to `http://localhost:3000/auth/login`
   - Click "Continue with Google"
   - Should redirect to Google sign-in
   - After auth, should redirect back to `/dashboard`

2. **Production Testing:**
   - Deploy to Vercel
   - Go to `https://soulbondai.vercel.app/auth/login`
   - Test Google sign-in flow

## Common Issues and Solutions

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Console matches exactly:
  - Production: `https://soulbondai.vercel.app/api/auth/callback/google`
  - Development: `http://localhost:3000/api/auth/callback/google`

### Error: "Callback"
- Check that environment variables are properly set in Vercel
- Verify NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

### Error: "Invalid client"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check that OAuth consent screen is properly configured

## Security Considerations

1. Never commit `.env.local` to version control
2. Use different OAuth clients for development and production
3. Regularly rotate your NEXTAUTH_SECRET
4. Review authorized domains and redirect URIs periodically

## Verification Checklist

- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] All redirect URIs added correctly
- [ ] Environment variables set in Vercel
- [ ] Local `.env.local` configured
- [ ] Google sign-in works locally
- [ ] Google sign-in works in production

## Support

If you continue to experience issues:
1. Check the browser console for errors
2. Review Vercel function logs
3. Verify all environment variables are set
4. Ensure your Google Cloud project is not in a restricted state