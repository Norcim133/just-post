# Setup Guide for Server-Side Token Storage

## Prerequisites

1. **Vercel Account**: You need a Vercel account with KV storage enabled
2. **Auth0 Application**: Configured with proper callback URLs
3. **Twitter OAuth App**: With OAuth 2.0 credentials

## Environment Variables

### Local Development (.env.local)

```bash
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_CALLBACK_URL=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://your-auth0-domain.auth0.com/api/v2/

# Twitter OAuth Configuration
VITE_TWITTER_CLIENT_ID=your-twitter-client-id
VITE_TWITTER_CLIENT_SECRET=your-twitter-client-secret
VITE_TWITTER_CALLBACK_URI=http://localhost:5173

# Token Encryption Key (generate a secure 32+ character string)
TOKEN_ENCRYPTION_KEY=your-secure-encryption-key-at-least-32-chars
```

### Production (Vercel Environment Variables)

In your Vercel project settings, add:

1. All the above variables (with production URLs)
2. KV storage variables (automatically added when you connect KV):
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

## Vercel KV Setup

1. In your Vercel dashboard, go to the Storage tab
2. Create a new KV database
3. Connect it to your project
4. The KV environment variables will be automatically added

## Auth0 Configuration

1. In Auth0 dashboard, ensure your application has:
   - Allowed Callback URLs: `http://localhost:5173, https://your-domain.vercel.app`
   - Allowed Logout URLs: `http://localhost:5173, https://your-domain.vercel.app`
   - Allowed Web Origins: `http://localhost:5173, https://your-domain.vercel.app`

2. Enable the following scopes:
   - `openid`
   - `profile`
   - `email`

## Twitter OAuth Setup

1. In Twitter Developer Portal, create an OAuth 2.0 app
2. Set redirect URI to: `http://localhost:5173` (and production URL)
3. Enable required scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your values

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Connect your KV database
4. Add all environment variables
5. Deploy!

## Security Notes

- Never commit `.env.local` or any file containing secrets
- Rotate `TOKEN_ENCRYPTION_KEY` periodically
- Use different encryption keys for development and production
- Monitor your KV usage to avoid rate limits