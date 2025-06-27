import { BlueSkyCredentials, TwitterLocalCredentials, TwitterSessionCredentials } from '../types';

const STORAGE_KEYS = {
  BLUESKY_CREDENTIALS: 'just-post-bluesky-credentials',
  TWITTER_LOCAL_CREDENTIALS: 'just-post-twitter-local-credentials',
  TWITTER_SESSION_CREDENTIALS: 'just-post-twitter-session-credentials',
  PLATFORM_ADDITIONS_KEY: 'just-post-platform-additions',
  PLATFORM_SELECTIONS_KEY: 'just-post-platform-selections'
} as const;

export const getPlatformsAdded = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLATFORM_ADDITIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to getPlatformsAdded');
    return null;
  }

}

export const savePlatformAdditions = (addedPlatforms: Record<string, boolean>) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PLATFORM_ADDITIONS_KEY,
      JSON.stringify(addedPlatforms)
    ) 
  } catch (error) {
    console.error('Failed to savePlatformAdditions')
  }
}

export const getPlatformSelections = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLATFORM_SELECTIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to getPlatformSelections');
    return null;
  }

}

export const savePlatformSelections = (platformSelections: Record<string, boolean>) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PLATFORM_SELECTIONS_KEY,
      JSON.stringify(platformSelections)
    ) 
  } catch (error) {
    console.error('Failed to savePlatformSelections')
  }
}

export class StorageService {
  
  static saveBlueSkyCredentials(credentials: BlueSkyCredentials): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.BLUESKY_CREDENTIALS,
        JSON.stringify(credentials)
      );
    } catch (error) {
      console.error('Failed to save BlueSky credentials:', error);
    }
  }

  static getBlueSkyCredentials(): BlueSkyCredentials | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BLUESKY_CREDENTIALS);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load BlueSky credentials:', error);
      return null;
    }
  }

  static removeBlueSkyCredentials(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.BLUESKY_CREDENTIALS);
    } catch (error) {
      console.error('Failed to remove BlueSky credentials:', error);
    }
  }

  static hasStoredCredentials(): boolean {
    return !!this.getBlueSkyCredentials();
  }
}

export class TwitterStorageService {

  static saveTwitterLocalCredentials(credentials: TwitterLocalCredentials): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TWITTER_LOCAL_CREDENTIALS,
        JSON.stringify(credentials));

    } catch (error) {
      console.error('Failed to load TwitterLocalCredentials: ', error);
    }

  }

    static saveTwitterSessionCredentials(credentials: TwitterSessionCredentials): void {
    try {
      sessionStorage.setItem(
        STORAGE_KEYS.TWITTER_SESSION_CREDENTIALS,
        JSON.stringify(credentials));

    } catch (error) {
      console.error('Failed to load TwitterLocalCredentials: ', error);
    }

  }

  static getTwitterLocalCredentials(): TwitterLocalCredentials | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TWITTER_LOCAL_CREDENTIALS);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load TwitterLocalCredentials: ', error);
      return null;
    }
  }

  static getTwitterSessionCredentials(): TwitterSessionCredentials | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.TWITTER_SESSION_CREDENTIALS);
      return stored ? JSON.parse(stored) : null;

    } catch (error) {
      console.error('Failed to load TwitterLocalCredentials: ', error);
      return null;
    }
  }

  static clearTwitterSessionCredentials(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.TWITTER_SESSION_CREDENTIALS);
    } catch (error) {
      console.error('Failed to clear Twitter session credentials:', error);
    }
  }

}