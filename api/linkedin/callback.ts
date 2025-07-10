import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { handleLinkedInCallback } from '../../src/lib/platforms/linkedin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;

        const { code, state } = req.query;
        if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
            return res.status(400).json({ error: 'Invalid callback request.' });
        }

        const success = await handleLinkedInCallback(code, state, session.user.id);
        if (!success) throw new Error("Failed to handle LinkedIn callback.");

        return res.redirect('/');
    } catch (error: any) {
        console.error("LinkedIn callback error:", error);
        return res.redirect('/?error=linkedin_login_failed');
    }
}