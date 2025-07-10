import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { loginToBlueSky } from '../../src/lib/platforms/bluesky.js';
import { setValue } from '../../src/lib/db.js';
import { BlueSkyCredentials, DB_KEYS } from '../../src/types/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Missing BlueSky identifier or password' });
        }

        const credentials: BlueSkyCredentials = { identifier, password }

        await loginToBlueSky(credentials);


        const db_response = await setValue(DB_KEYS.BLUESKY_CREDENTIALS, session.user.id, credentials)

        if (!db_response) {
            return res.status(400).json({error: "Error saving credentials to db"})
        }
        
        return res.status(200).json({ message: 'BlueSky account connected successfully.' });

    } catch (error: any) {
        console.error('BlueSky login endpoint error:', error);
        res.status(500).json({ error: 'Login failed. Please check your credentials.' });
    }
}