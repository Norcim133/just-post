import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { postToTwitterForUser } from '../../src/lib/platforms/twitter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;

        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Bad Request: Missing post text' });
        }

        const result = await postToTwitterForUser(session.user.id, text);

        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(result);
        }

    } catch (error: any) {
        console.error("Error in /api/twitter/post handler:", error);
        return res.status(500).json({ platform: 'twitter', success: false, error: 'An unexpected server error occurred.' });
    }
}