import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { loginToBlueSky } from '../../src/lib/platforms/bluesky.js';
import { getCredentials } from '../../src/lib/db.js';

const BLUESKY_API_BASE = 'https://bsky.social/xrpc';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing post text' });

    try {
        const credentials = await getCredentials('bluesky', session.user.id)
        if (!credentials) return res.status(403).json({ error: 'BlueSky credentials not found.' });

        // 2. Use the helper to get a fresh login session from BlueSky.
        const { accessJwt, did } = await loginToBlueSky(credentials);

        // 3. Make the actual post request.
        const response = await fetch(`${BLUESKY_API_BASE}/com.atproto.repo.createRecord`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessJwt}`,
            },
            body: JSON.stringify({
                repo: did,
                collection: 'app.bsky.feed.post',
                record: {
                    text,
                    $type: 'app.bsky.feed.post',
                    createdAt: new Date().toISOString(),
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Post failed: ${errorData.message || response.statusText}`);
        }

        const blueSkyResult = await response.json();

        const successResult = {
            platform: 'bluesky',
            success: true,
            postId: blueSkyResult.uri, // Pass the post ID from the BlueSky response
        };

        return res.status(200).json(successResult);

    } catch (error: any) {
        console.error('BlueSky post endpoint error:', error);
        // Also ensure the error response from the catch block matches the expected format
        const errorResult = {
            platform: 'bluesky',
            success: false,
            error: error.message,
        };
        res.status(500).json(errorResult);
    }
}