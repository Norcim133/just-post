import { BlueSkyCredentials } from '../types';

const STORAGE_KEYS = {
  BLUESKY_CREDENTIALS: 'just-post-bluesky-credentials',
} as const;

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