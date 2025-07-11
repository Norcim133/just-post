export const DB_KEYS = {
    // Prefixes for BlueSky
    BLUESKY_CREDENTIALS: 'bluesky',

    // Prefixes for Twitter
    TWITTER_PKCE: 'twitter_pkce',
    TWITTER_TOKENS: 'twitter_tokens',

    // Prefixes for LinkedIn
    LINKEDIN_CODES: 'linkedin_codes',
    LINKEDIN_TOKENS: 'linkedin_tokens',

    // Threads
    THREADS_CODES: 'threads_codes',
    THREADS_TOKENS: 'threads_tokens',
}

// BLUESKY

export interface BlueSkyCredentials {
  identifier: string; // username or email
  password: string; // app-specific password
}


// TWITTER
export interface TwitterAuthCodes {
    codeVerifier: string;
    stateToken: string;
}

export interface TwitterTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface TwitterTokenResponse {
   access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}


// LINKEDIN
export interface LinkedInTokens {
    accessToken: string;
    personUrn: string; // The user's unique LinkedIn ID, e.g., "urn:li:person:xxxx"
    expiresAt: number;
}

export interface LinkedInAuthCodes {
    stateToken: string;
}


// THREADS
export interface ThreadsCodes {
  stateToken: string;
}

export interface ThreadsTokens {
    accessToken: string; // This will be the LONG-LIVED token
    userId: string;      // The user's numeric Threads ID... needs to maintained as string due to JS imprecision with very large numbers
    expiresAt: number;
}

export interface ThreadsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}


export interface SocialPost {
  text: string;
  platforms: string[];
}

export interface PostResult {
  platform: string;
  success: boolean;
  error?: string;
  postId?: string;
}

export interface PlatformConfig {
  name: string;
  charLimit: number;
  allowsMedia: boolean;
  allowsThreads: boolean;
  color: string;
  icon: string;
}

export interface PlatformState {
  id: string;
  isAdded: boolean;
  isConnected: boolean;
  isSelected: boolean;
  config: PlatformConfig;
}

export interface Platforms {
  [key: string]: PlatformState
}


export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  bluesky:{
    name: 'BlueSky',
    charLimit: 300,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-sky-500',
    icon: '🦋' 
  },
  linkedin:{
    name: 'LinkedIn',
    charLimit: 3000,
    allowsMedia: true,
    allowsThreads: false,
    color: 'bg-blue-700',
    icon: 'in' 
  },
  twitter:{
    name: 'Twitter/X',
    charLimit: 280,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-slate-900',
    icon: '𝕏' 
  },
  // For more on post constraints: https://developers.facebook.com/docs/threads/posts
  threads:{
    name: 'Threads',
    charLimit: 500,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-gray-900',
    icon: '@' 
  }
};
