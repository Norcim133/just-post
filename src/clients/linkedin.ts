import type { PostResult } from '../types/index.js';
const API_BASE_URL = '/api/linkedin';

export class LinkedInService {
  async getLoginUrl(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('LinkedIn getLoginUrl client error:', error);
      return null;
    }
  }

  async getStatus(): Promise<{ isConnected: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      if (!response.ok) return { isConnected: false };
      return response.json();
    } catch (error) {
      console.error('LinkedIn getStatus client error:', error);
      return { isConnected: false };
    }
  }

  async createPost(text: string): Promise<PostResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return response.json();
    } catch (error) {
      console.error('LinkedIn createPost client error:', error);
      return { platform: 'linkedin', success: false, error: 'Network error occurred.' };
    }
  }
}