import { Redis } from '@upstash/redis';
import { encryptToken, decryptToken } from './crypto';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export interface StoredTokens {
  twitter?: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
  };
  bluesky?: {
    accessJwt: string;
    refreshJwt: string;
    did: string;
    handle: string;
  };
  linkedin?: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
  };
  threads?: {
    accessToken: string;
    userId: string;
  };
}

export class TokenStorageService {
  private static getKey(userId: string): string {
    return `user_tokens:${userId}`;
  }

  /**
   * Save tokens for a specific platform
   */
  static async saveTokens(
    userId: string, 
    platform: keyof StoredTokens, 
    tokens: StoredTokens[keyof StoredTokens]
  ): Promise<void> {
    try {
      const key = this.getKey(userId);
      
      // Get existing tokens
      const existingTokens = await this.getTokens(userId);
      
      // Encrypt sensitive token data
      const encryptedTokens = { ...tokens };
      if ('accessToken' in encryptedTokens && encryptedTokens.accessToken) {
        encryptedTokens.accessToken = encryptToken(encryptedTokens.accessToken as string);
      }
      if ('refreshToken' in encryptedTokens && encryptedTokens.refreshToken) {
        encryptedTokens.refreshToken = encryptToken(encryptedTokens.refreshToken as string);
      }
      if ('accessJwt' in encryptedTokens && encryptedTokens.accessJwt) {
        encryptedTokens.accessJwt = encryptToken(encryptedTokens.accessJwt as string);
      }
      if ('refreshJwt' in encryptedTokens && encryptedTokens.refreshJwt) {
        encryptedTokens.refreshJwt = encryptToken(encryptedTokens.refreshJwt as string);
      }
      
      // Update tokens for the specific platform
      const updatedTokens: StoredTokens = {
        ...existingTokens,
        [platform]: encryptedTokens
      };
      
      // Store in Redis with 30 day expiration (in seconds)
      await redis.set(key, updatedTokens, { ex: 60 * 60 * 24 * 30 });
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw new Error('Failed to save tokens');
    }
  }

  /**
   * Get all tokens for a user
   */
  static async getTokens(userId: string): Promise<StoredTokens> {
    try {
      const key = this.getKey(userId);
      const tokens = await redis.get<StoredTokens>(key);
      
      if (!tokens) {
        return {};
      }
      
      // Decrypt tokens
      const decryptedTokens: StoredTokens = {};
      
      for (const [platform, platformTokens] of Object.entries(tokens)) {
        const decrypted = { ...platformTokens };
        
        if ('accessToken' in decrypted && decrypted.accessToken) {
          decrypted.accessToken = decryptToken(decrypted.accessToken as string);
        }
        if ('refreshToken' in decrypted && decrypted.refreshToken) {
          decrypted.refreshToken = decryptToken(decrypted.refreshToken as string);
        }
        if ('accessJwt' in decrypted && decrypted.accessJwt) {
          decrypted.accessJwt = decryptToken(decrypted.accessJwt as string);
        }
        if ('refreshJwt' in decrypted && decrypted.refreshJwt) {
          decrypted.refreshJwt = decryptToken(decrypted.refreshJwt as string);
        }
        
        decryptedTokens[platform as keyof StoredTokens] = decrypted;
      }
      
      return decryptedTokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return {};
    }
  }

  /**
   * Get tokens for a specific platform
   */
  static async getPlatformTokens(
    userId: string, 
    platform: keyof StoredTokens
  ): Promise<StoredTokens[keyof StoredTokens] | null> {
    try {
      const tokens = await this.getTokens(userId);
      return tokens[platform] || null;
    } catch (error) {
      console.error('Error getting platform tokens:', error);
      return null;
    }
  }

  /**
   * Delete tokens for a specific platform
   */
  static async deletePlatformTokens(
    userId: string, 
    platform: keyof StoredTokens
  ): Promise<void> {
    try {
      const key = this.getKey(userId);
      const tokens = await this.getTokens(userId);
      
      delete tokens[platform];
      
      if (Object.keys(tokens).length === 0) {
        // No tokens left, delete the key
        await redis.del(key);
      } else {
        // Update with remaining tokens
        await redis.set(key, tokens, { ex: 60 * 60 * 24 * 30 });
      }
    } catch (error) {
      console.error('Error deleting platform tokens:', error);
      throw new Error('Failed to delete tokens');
    }
  }

  /**
   * Delete all tokens for a user
   */
  static async deleteAllTokens(userId: string): Promise<void> {
    try {
      const key = this.getKey(userId);
      await redis.del(key);
    } catch (error) {
      console.error('Error deleting all tokens:', error);
      throw new Error('Failed to delete all tokens');
    }
  }
}