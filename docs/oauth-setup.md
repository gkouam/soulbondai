# OAuth Provider Setup Guide

This guide walks you through setting up OAuth providers for SoulBond AI.

## Supported Providers

SoulBond AI supports the following OAuth providers:
- Google
- Apple
- Facebook
- Twitter
- Discord

All OAuth providers are optional. You can enable any combination of providers based on your needs.

## Configuration

### 1. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env` file:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 2. Apple OAuth

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID with Sign in with Apple enabled
3. Create a Service ID and configure it
4. Create a private key for Sign in with Apple
5. Add redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback/apple`
   - Production: `https://yourdomain.com/api/auth/callback/apple`
6. Configure in `.env`:
   ```
   APPLE_ID=your-service-id
   APPLE_SECRET=your-generated-secret
   ```

### 3. Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://yourdomain.com/api/auth/callback/facebook`
5. Add to `.env`:
   ```
   FACEBOOK_CLIENT_ID=your-app-id
   FACEBOOK_CLIENT_SECRET=your-app-secret
   ```

### 4. Twitter OAuth 2.0

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app with OAuth 2.0 enabled
3. Add callback URLs:
   - Development: `http://localhost:3000/api/auth/callback/twitter`
   - Production: `https://yourdomain.com/api/auth/callback/twitter`
4. Configure in `.env`:
   ```
   TWITTER_CLIENT_ID=your-client-id
   TWITTER_CLIENT_SECRET=your-client-secret
   ```

### 5. Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirects:
   - Development: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://yourdomain.com/api/auth/callback/discord`
5. Add to `.env`:
   ```
   DISCORD_CLIENT_ID=your-client-id
   DISCORD_CLIENT_SECRET=your-client-secret
   ```

## Testing OAuth

After configuring your providers:

1. Restart your development server
2. Visit `/auth/login` or `/auth/register`
3. You should see buttons for all configured providers
4. Test each provider to ensure proper configuration

## Troubleshooting

### Common Issues

1. **"Callback URL mismatch"**: Ensure your redirect URIs match exactly (including trailing slashes)
2. **"Invalid client"**: Double-check your client ID and secret
3. **Provider not showing**: Ensure both CLIENT_ID and CLIENT_SECRET are set in `.env`

### Security Considerations

- Never commit OAuth credentials to version control
- Use different OAuth apps for development and production
- Regularly rotate client secrets
- Monitor OAuth app usage for suspicious activity

## Adding New Providers

To add a new OAuth provider:

1. Install the NextAuth provider package
2. Update `/lib/oauth-config.ts` with the new provider configuration
3. Add the provider setup in `/lib/oauth-config.ts` `getEnabledProviders()` function
4. Add UI configuration for the provider icon and colors
5. Update this documentation

## OAuth Flow

The OAuth flow in SoulBond AI:

1. User clicks OAuth provider button
2. Redirected to provider's consent screen
3. Provider redirects back with authorization code
4. NextAuth exchanges code for tokens
5. User profile is created/updated in database
6. User is signed in and redirected to dashboard