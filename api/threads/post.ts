// api/threads/posts.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { postToThreadsForUser } from '../../src/lib/platforms/threads.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    try {

        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;
        
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Missing post text' });
        
        const result = await postToThreadsForUser(session.user.id, text);
        const statusCode = result.success ? 200 : 500;
        return res.status(statusCode).json(result);
    } catch (error: any) {
        console.error('Threads post endpoint error:', error);
        // Also ensure the error response from the catch block matches the expected format
        const errorResult = {
            platform: 'threads',
            success: false,
            error: error.message,
        };
        res.status(500).json(errorResult); //Check works
    }
}