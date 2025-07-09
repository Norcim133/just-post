import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { logoutFromTwitterForUser } from '../../src/lib/platforms/twitter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Logout should be a POST request to prevent CSRF vulnerabilities.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;

        const success = await logoutFromTwitterForUser(session.user.id);

        if (success) {
            return res.status(200).json({ success: true, message: 'Successfully logged out from Twitter.' });
        } else {
            // This would likely indicate a database issue.
            return res.status(500).json({ success: false, error: 'Failed to complete logout process.' });
        }

    } catch (error: any) {
        console.error("Error in /api/twitter/logout handler:", error);
        return res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
    }
}