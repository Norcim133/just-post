import { PostResult } from '../types/index.js';
const API_BASE_URL = '/api/twitter';


export class TwitterService {

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

        const data = await response.json()

        return data.authUrl

    } catch (error) {
        console.error('Twitter login error in client:', error);
        return null;
    }
  }

  isAuthenticated(): boolean {
    return false;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const thing = {code:state,
        string:code
    }
    return !thing;
  }

  async createPost(): Promise<PostResult> {
    const pr: PostResult = {
        platform: "god",
        success: false,
        error: "error",
        postId: "god",
    }
    return pr;
  }
  

}