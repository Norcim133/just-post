//api/threads/status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { verifyThreadsAuthentication } from '../../src/lib/platforms/threads.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {

        const session = await getSessionOrUnauthorized(req, res);
        if (!session) return;
        
        const isConnected = await verifyThreadsAuthentication(session.user.id);
        
        return res.status(200).json({ isConnected: isConnected });

    } catch (error: any) {
        console.error("Error in Threads status check:", error);
        return res.status(500).json({ isConnected: false, error: 'An unexpected error occurred.' });
    }

}