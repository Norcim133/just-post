//api/threads/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { startLoginProcess } from '../../src/lib/platforms/threads.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const session = await getSessionOrUnauthorized(req, res);
    if (!session) return;

    try {
        const authUrl = await startLoginProcess(session.user.id);
        if (!authUrl) throw new Error("Failed to generate Threads auth URL.");
        return res.status(200).json({ authUrl });
    } catch (error: any) {
        console.error("Threads login error:", error);
        return res.status(500).json({ error: "Could not initiate Threads login." });
    }
}