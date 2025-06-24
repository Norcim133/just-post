import type { VercelResponse } from '@vercel/node';
import { withAuth, type AuthenticatedRequest } from '../lib/auth';
import { TokenStorageService } from '../lib/token-storage';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
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
      // Delete tokens for specific platform
      await TokenStorageService.deletePlatformTokens(req.user.sub, platform as any);
    } else {
      // Delete all tokens
      await TokenStorageService.deleteAllTokens(req.user.sub);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete tokens error:', error);
    res.status(500).json({ 
      error: 'Failed to delete tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);