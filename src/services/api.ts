import { useAuth0 } from '@auth0/auth0-react';

class ApiService {
  private getAuthToken: () => Promise<string | null> = async () => null;

  setAuthTokenGetter(getter: () => Promise<string | null>) {
    this.getAuthToken = getter;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async saveTokens(platform: string, tokens: any): Promise<void> {
    const response = await fetch('/api/tokens/save', {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ platform, tokens }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save tokens');
    }
  }

  async getTokens(platform?: string): Promise<any> {
    const url = platform 
      ? `/api/tokens/get?platform=${platform}`
      : '/api/tokens/get';
      
    const response = await fetch(url, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get tokens');
    }

    const data = await response.json();
    return data.tokens;
  }

  async deleteTokens(platform?: string): Promise<void> {
    const url = platform 
      ? `/api/tokens/delete?platform=${platform}`
      : '/api/tokens/delete';
      
    const response = await fetch(url, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete tokens');
    }
  }

  async postToTwitter(text: string): Promise<any> {
    const response = await fetch('/api/twitter-tweet-v2', {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to post to Twitter');
    }

    return response.json();
  }

  // Public method to get headers for Twitter OAuth
  async getAuthHeaders(): Promise<HeadersInit> {
    return this.getHeaders();
  }
}

export const apiService = new ApiService();

// Hook to set up auth token getter
export function useApiService() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  apiService.setAuthTokenGetter(async () => {
    if (!isAuthenticated) return null;
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  });
  
  return apiService;
}