import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { getValue } from '../../src/lib/db.js';
import { DB_KEYS } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    const tokens = await getValue(DB_KEYS.LINKEDIN_TOKENS, session.user.id);
    return res.status(200).json({ isConnected: !!tokens });
}