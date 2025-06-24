import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../lib/auth';
import { TokenStorageService } from '../lib/token-storage';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!req.user?.sub) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const { platform } = req.query;
    
    if (platform && typeof platform === 'string') {
      // Get tokens for specific platform
      const tokens = await TokenStorageService.getPlatformTokens(req.user.sub, platform as any);
      res.status(200).json({ tokens });
    } else {
      // Get all tokens
      const tokens = await TokenStorageService.getTokens(req.user.sub);
      res.status(200).json({ tokens });
    }
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);