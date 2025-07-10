import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { postToLinkedInForUser } from '../../src/lib/platforms/linkedin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;
    
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing post text' });

    const result = await postToLinkedInForUser(session.user.id, text);
    const statusCode = result.success ? 200 : 500;
    return res.status(statusCode).json(result);
}