import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { getSessionOrUnauthorized } from '../lib/request-helper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    try {
        const userKey = `bluesky_credentials:${session.user.id}`;
        const credentials = await kv.get(userKey);
        
        return res.status(200).json({ isConnected: !!credentials });

    } catch (error: any) {
        console.error('BlueSky status endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
}