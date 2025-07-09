import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { verifyTwitterAuthentication } from '../../src/lib/platforms/twitter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;

        // All the complex logic is now in one simple function call.
        const isConnected = await verifyTwitterAuthentication(session.user.id);

        // Always return a consistent JSON response.
        return res.status(200).json({ isConnected: isConnected });

    } catch (error: any) {
        console.error("Error in Twitter status check:", error);
        return res.status(500).json({ isConnected: false, error: 'An unexpected error occurred.' });
    }
}