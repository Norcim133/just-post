import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { getValue } from '../../src/lib/db.js';
import { BlueSkyCredentials } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    try {
        const credentials: BlueSkyCredentials | null = await getValue('bluesky', session.user.id)
        if (!credentials) return res.status(403).json({ error: 'BlueSky credentials not found.' });
        
        return res.status(200).json({ isConnected: !!credentials });

    } catch (error: any) {
        console.error('BlueSky status endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
}