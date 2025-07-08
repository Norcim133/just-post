import { BlueSkyCredentials, PostResult } from '../types';

const API_BASE_URL = '/api/bluesky';

export class BlueSkyService {

  async login(credentials: BlueSkyCredentials): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response.ok;
    } catch (error) {
      console.error('BlueSky login via backend error:', error);
      return false;
    }
  }
  
  async createPost(text: string): Promise<PostResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { platform: 'bluesky', success: false, error: data.error || 'Post failed' };
      }
      
      // now returns a fully-formed PostResult object
      return data;

    } catch (error) {
      console.error('BlueSky post via backend error:', error);
      return {
        platform: 'bluesky',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown network error',
      };
    }
  }

  async getStatus(): Promise<{ isConnected: boolean }> {
      try {
          const response = await fetch(`${API_BASE_URL}/status`);
          if (!response.ok) {
              return { isConnected: false };
          }
          const data = await response.json();
          return { isConnected: data.isConnected };
      } catch (error) {
          console.error("Failed to fetch BlueSky connection status:", error);
          return { isConnected: false };
      }
  }

  // Consider logout
}