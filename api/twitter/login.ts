import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { startLoginProcess } from '../../src/lib/platforms/twitter.js'

export default async function login(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    try {
        // Assume the front will check status so don't handle checks for refresh/access token here
        const authUrl = await startLoginProcess(session.user.id)

        if (!authUrl) {
            console.error('Failed to generate Twitter authUrl due to server-side configuration issue.');
            return res.status(500).json({ error: "Could not initiate Twitter login. Please try again later." });
        }
        return res.status(200).json({ authUrl: authUrl });

    } catch (error: any) {
        console.error('There was an error with Twitter login: ', error)
        return res.status(500).json({ error: 'An unexpected error occurred during Twitter login.' });
    }
}