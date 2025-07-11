import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { handleThreadsCallback } from '../../src/lib/platforms/threads.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;

        const { code, state } = req.query;
        if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
            return res.status(400).json({ error: 'Invalid callback request.' });
        }

        const success = await handleThreadsCallback(code, state, session.user.id);
        if (!success) throw new Error("Failed to handle Threads callback.");

        return res.redirect('/');
    } catch (error: any) {
        console.error("Threads callback error:", error);
        return res.redirect('/?error=Threads_login_failed');
    }
}