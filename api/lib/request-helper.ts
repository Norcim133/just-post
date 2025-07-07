import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from '../../src/lib/auth.js';

// Helper to convert Vercel's request headers into the standard Headers object.
function getHeadersFromVercelReq(req: VercelRequest): Headers {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
            if (Array.isArray(value)) {
                for (const v of value) {
                    headers.append(key, v);
                }
            } else {
                headers.set(key, String(value));
            }
        }
    }
    return headers;
}

// This function now correctly gets the session and handles the 401 response.
export async function getSessionOrUnauthorized(req: VercelRequest, res: VercelResponse) {
    const headers = getHeadersFromVercelReq(req);

    try {
        // --- THIS IS THE CORRECTED API CALL ---
        // We use the 'api' object from our auth instance as shown in the documentation.
        const session = await auth.api.getSession({ headers });

        if (!session?.user) {
            res.status(401).json({ error: 'Unauthorized: You must be logged in.' });
            return null;
        }

        return session;

    } catch (error: any) {
        // This will catch potential errors from getSession if the token is malformed, etc.
        console.error("Error in getSessionOrUnauthorized:", error);
        res.status(500).json({ error: 'Failed to process session.' });
        return null;
    }
}