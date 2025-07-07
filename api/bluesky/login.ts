import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { getSessionOrUnauthorized } from '../lib/request-helper.js';
import { loginToBlueSky } from '../lib/bluesky-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Missing BlueSky identifier or password' });
        }

        await loginToBlueSky({ identifier, password });

        const userKey = `bluesky_credentials:${session.user.id}`;
        await kv.set(userKey, { identifier, password });
        
        return res.status(200).json({ message: 'BlueSky account connected successfully.' });

    } catch (error: any) {
        console.error('BlueSky login endpoint error:', error);
        res.status(500).json({ error: 'Login failed. Please check your credentials.' });
    }
}