import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../lib/auth';
import { TokenStorageService, type StoredTokens } from '../lib/token-storage';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { platform, tokens } = req.body;
    
    if (!platform || !tokens) {
      res.status(400).json({ error: 'Missing platform or tokens' });
      return;
    }
    
    if (!req.user?.sub) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Validate platform
    const validPlatforms: (keyof StoredTokens)[] = ['twitter', 'bluesky', 'linkedin', 'threads'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({ error: 'Invalid platform' });
      return;
    }
    
    // Save tokens
    await TokenStorageService.saveTokens(req.user.sub, platform, tokens);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save tokens error:', error);
    res.status(500).json({ 
      error: 'Failed to save tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);