import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TokenStorageService } from './lib/token-storage';
import { verifyAuth0Token } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Auth0 token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const decoded = await verifyAuth0Token(authHeader);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.sub;
    
    // Get the token parameters from body
    const tokenParams = req.body;
    
    // Convert body to URL params string
    const bodyString = new URLSearchParams(tokenParams).toString();
    
    console.log('Proxying request to Twitter for user:', userId);

    // Get client credentials from environment variables
    const clientId = process.env.VITE_TWITTER_CLIENT_ID;
    const clientSecret = process.env.VITE_TWITTER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Twitter client credentials not configured');
    }
    
    // Create Basic Auth header
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Forward the request to Twitter's token endpoint
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: bodyString,
    });

    const data: any = await response.json();
    console.log('Twitter response:', response.status, data);
    
    // If successful and we have a userId, save the tokens
    if (response.status === 200 && userId && data.access_token) {
      try {
        await TokenStorageService.saveTokens(userId, 'twitter', {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined
        });
        console.log('Tokens saved successfully for user:', userId);
      } catch (saveError) {
        console.error('Failed to save tokens:', saveError);
        // Don't fail the request if saving fails, user can still use the tokens
      }
    }

    // Return the same status code as Twitter
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Twitter token proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}