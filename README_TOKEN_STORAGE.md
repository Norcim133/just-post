# Server-Side Token Storage Implementation

## Overview

This implementation migrates social media platform tokens from browser storage (localStorage/sessionStorage) to secure server-side storage using Vercel KV (Redis). All tokens are encrypted at rest and associated with Auth0 user IDs.

## Architecture

### Token Flow

1. **Authentication Flow**:
   - User authenticates with Auth0
   - User connects social platform (e.g., Twitter)
   - OAuth tokens are exchanged server-side
   - Tokens are encrypted and stored in Vercel KV
   - Frontend never sees actual tokens

2. **API Usage Flow**:
   - Frontend makes authenticated request with Auth0 JWT
   - API verifies JWT and extracts user ID
   - API retrieves encrypted tokens from KV
   - API decrypts tokens and makes platform API calls
   - Results returned to frontend

### Key Components

#### Backend (`/api`)

1. **Token Storage Service** (`api/lib/token-storage.ts`)
   - Manages CRUD operations for tokens in Vercel KV
   - Handles encryption/decryption transparently
   - Supports multiple platforms per user

2. **Crypto Utilities** (`api/lib/crypto.ts`)
   - AES-256-GCM encryption for tokens
   - PBKDF2 key derivation with salt
   - Base64 encoding for storage

3. **Auth Middleware** (`api/lib/auth.ts`)
   - Verifies Auth0 JWTs
   - Extracts user information
   - Protects API endpoints

4. **API Endpoints**:
   - `/api/tokens/save` - Save tokens for a platform
   - `/api/tokens/get` - Retrieve tokens (all or specific platform)
   - `/api/tokens/delete` - Remove tokens
   - `/api/twitter-token-v2` - Twitter OAuth callback handler
   - `/api/twitter-tweet-v2` - Post to Twitter using stored tokens

#### Frontend (`/src`)

1. **API Service** (`src/services/api.ts`)
   - Handles authenticated API calls
   - Manages Auth0 token retrieval
   - Provides typed methods for backend communication

2. **Twitter Service V2** (`src/services/twitter-v2.ts`)
   - Removed direct token storage
   - Uses API service for all operations
   - Maintains OAuth flow for initial connection

### Security Features

1. **Token Encryption**:
   - All tokens encrypted with AES-256-GCM
   - Unique salt per encryption operation
   - Auth tags prevent tampering

2. **Access Control**:
   - All token operations require Auth0 authentication
   - Tokens scoped to authenticated user ID
   - JWT verification on every request

3. **Key Management**:
   - Encryption key stored in environment variables
   - Different keys for dev/production
   - Keys never exposed to frontend

### Platform Support

Currently implemented for Twitter, but the architecture supports:
- BlueSky (tokens structure defined)
- LinkedIn (tokens structure defined)
- Threads (tokens structure defined)

To add a new platform:
1. Add token interface to `StoredTokens` type
2. Implement OAuth flow endpoint
3. Create platform-specific API endpoint
4. Update frontend service

### Deployment Requirements

1. **Vercel KV**:
   - Create KV database in Vercel dashboard
   - Connect to project (auto-adds env vars)

2. **Environment Variables**:
   ```
   # Auth0
   VITE_AUTH0_DOMAIN
   VITE_AUTH0_CLIENT_ID
   VITE_AUTH0_CALLBACK_URL
   VITE_AUTH0_AUDIENCE
   
   # Twitter OAuth
   VITE_TWITTER_CLIENT_ID
   VITE_TWITTER_CLIENT_SECRET
   VITE_TWITTER_CALLBACK_URI
   
   # Security
   TOKEN_ENCRYPTION_KEY (32+ chars)
   
   # Vercel KV (auto-added)
   KV_URL
   KV_REST_API_URL
   KV_REST_API_TOKEN
   KV_REST_API_READ_ONLY_TOKEN
   ```

### Migration Notes

- Old localStorage/sessionStorage code preserved in original files
- New services suffixed with `-v2` for easy rollback
- Frontend components updated to use new services
- Backward compatibility maintained during transition

### Future Enhancements

1. **Token Refresh**:
   - Automatic refresh for expired tokens
   - Background refresh before expiration

2. **Multi-Platform Posting**:
   - Batch operations for efficiency
   - Parallel posting with error handling

3. **Token Rotation**:
   - Periodic re-encryption with new keys
   - Key versioning support

4. **Audit Trail**:
   - Log token usage
   - Track API calls per user