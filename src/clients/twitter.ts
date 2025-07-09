import { PostResult } from '../types/index.js';
const API_BASE_URL = '/api/twitter';

export class TwitterService {

  /**
   * Calls the backend to generate a secure Twitter auth URL.
   * @returns The URL to redirect the user to, or null if an error occurred.
   */
  async getLoginUrl(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error('Backend failed to generate auth URL:', await response.text());
        return null;
      }

      const data = await response.json();
      return data.authUrl;

    } catch (error) {
      console.error('Twitter login error in client:', error);
      return null;
    }
  }

  /**
   * Asks the backend if the current user has valid tokens for Twitter.
   * @returns An object like { isConnected: boolean }
   */
  async getStatus(): Promise<{ isConnected: boolean }> {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        if (!response.ok) {
            // A non-200 response from the status check means not connected.
            return { isConnected: false };
        }
        const data = await response.json();
        return { isConnected: data.isConnected };
    } catch (error) {
        console.error("Failed to fetch Twitter connection status:", error);
        return { isConnected: false };
    }
  }

  /**
   * Sends a post request to our backend.
   * @param text - The text content of the tweet.
   * @returns A PostResult object from the backend.
   */
  async createPost(text: string): Promise<PostResult> {
    try {
        const response = await fetch(`${API_BASE_URL}/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        const data = await response.json();

        // The backend already returns data in the PostResult format,
        // so we just pass it along. The 'success' property will be in the data.
        if (!response.ok) {
            return { platform: 'twitter', success: false, error: data.error || 'Failed to post' };
        }

        return data;

    } catch (error) {
        console.error("Error posting to Twitter via backend:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
        return { platform: 'twitter', success: false, error: errorMessage };
    }
  }
  
  /**
   * Tells our backend to log the user out from Twitter.
   */
  async logout(): Promise<void> {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Error logging out from Twitter:", error);
        // We can swallow this error as it's not critical for UI state.
        // The main goal is to get the UI to a "disconnected" state.
    }
  }
}