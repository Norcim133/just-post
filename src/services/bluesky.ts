import { BlueSkyCredentials, PostResult } from '../types';
import { BlueSkyStorageService } from './storage';

const BLUESKY_API_BASE = 'https://bsky.social/xrpc';

export class BlueSkyService {
  private accessJwt: string | null = null;
  private did: string | null = null;

  logout(): void {
    this.accessJwt = null;
    this.did = null;
    BlueSkyStorageService.removeBlueSkyCredentials();
  }

  async login(credentials: BlueSkyCredentials): Promise<boolean> {
    try {
      const response = await fetch(`${BLUESKY_API_BASE}/com.atproto.server.createSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: credentials.identifier,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessJwt = data.accessJwt;
      this.did = data.did;
      
      return true;
    } catch (error) {
      console.error('BlueSky login error:', error);
      return false;
    }
  }

  async createPost(text: string): Promise<PostResult> {
    if (!this.accessJwt || !this.did) {
      return {
        platform: 'bluesky',
        success: false,
        error: 'Not authenticated',
      };
    }

    try {
      const response = await fetch(`${BLUESKY_API_BASE}/com.atproto.repo.createRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessJwt}`,
        },
        body: JSON.stringify({
          repo: this.did,
          collection: 'app.bsky.feed.post',
          record: {
            text,
            $type: 'app.bsky.feed.post',
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Post failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        platform: 'bluesky',
        success: true,
        postId: data.uri,
      };
    } catch (error) {
      console.error('BlueSky post error:', error);
      return {
        platform: 'bluesky',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isAuthenticated(): boolean {
    return !!(this.accessJwt && this.did);
  }
}