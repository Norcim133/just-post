export interface BlueSkyCredentials {
  identifier: string; // username or email
  password: string; // app-specific password
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
  id: string;
  name: string;
  charLimit: number;
  allowsMedia: boolean;
  allowsThreads: boolean;
  color: string;
  icon: string;
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  bluesky:{
    id: 'bluesky',
    name: 'BlueSky',
    charLimit: 300,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-sky-500',
    icon: '🦋' 
  },
  linkedin:{
    id: 'linkedin',
    name: 'LinkedIn',
    charLimit: 3000,
    allowsMedia: true,
    allowsThreads: false,
    color: 'bg-blue-700',
    icon: 'in' 
  },
  twitter:{
    id: 'twitter',
    name: 'Twitter/X',
    charLimit: 280,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-slate-900',
    icon: '𝕏' 
  },
  threads:{
    id: 'threads',
    name: 'Threads',
    charLimit: 500,
    allowsMedia: true,
    allowsThreads: true,
    color: 'bg-gray-900',
    icon: '@' 
  }
};
