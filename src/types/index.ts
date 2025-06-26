export interface BlueSkyCredentials {
  identifier: string; // username or email
  password: string; // app-specific password
}

export interface TwitterSessionCredentials {
  verifierCode: string | null;
  challengeCode: string | null;
  stateToken: string | null;
}

export interface TwitterLocalCredentials {
  accessToken: string | null;
  refreshToken: string | null;
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
  threads:{
    name: 'Threads',
    charLimit: 500,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-gray-900',
    icon: '@' 
  }
};
