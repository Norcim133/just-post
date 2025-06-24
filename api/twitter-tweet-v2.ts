import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from './lib/auth';
import { TokenStorageService } from './lib/token-storage';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!req.user?.sub) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Get Twitter tokens from KV storage
    const twitterTokens = await TokenStorageService.getPlatformTokens(req.user.sub, 'twitter');
    
    if (!twitterTokens || !('accessToken' in twitterTokens)) {
      res.status(401).json({ error: 'Twitter not connected' });
      return;
    }
    
    // Forward the request to Twitter's tweet endpoint
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${twitterTokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('Twitter tweet response:', response.status, data);
    
    // Check if token needs refresh (401 response)
    if (response.status === 401 && 'refreshToken' in twitterTokens && twitterTokens.refreshToken) {
      // TODO: Implement token refresh logic
      console.log('Token expired, need to refresh');
    }

    // Return the same status code as Twitter
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Twitter tweet proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default withAuth(handler);