import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { TwitterService } from '../../src/lib/platforms/twitter.js'

export default async function login(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    const service = new TwitterService();

    

    // Assume the front will chck status so don't handle checks for refresh/access token here

    // 

    const authURL = getAuthURL()
    return res.status(200).json({ message: authURL });
}