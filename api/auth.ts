// api/auth.ts

import { auth } from '../src/lib/auth.js';

export const config = {
    api: {
        bodyParser: true,
    },
};

export default async function handler(req: any, res: any) {
    try {
        // Build a standard Request object that Better Auth expects
        const host = req.headers.host || 'localhost:3000';
        const protocol = 'http';
        const url = `${protocol}://${host}${req.url}`;
        
        console.log('Request:', req.method, url);
        console.log('Vercel body:', req.body);
        
        // For Vercel, the body is already parsed
        let body = undefined;
        if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
            body = JSON.stringify(req.body);
        }
        
        // Create headers object
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
            if (value) {
                headers.set(key, String(value));
            }
        }
        
        // Create a standard Request
        const request = new Request(url, {
            method: req.method,
            headers: headers,
            body: body,
        });
        
        // Call Better Auth directly
        const response = await auth.handler(request);
        
        // Send the response back
        res.status(response.status || 200);
        
        for (const [key, value] of response.headers.entries()) {
            res.setHeader(key, value);
        }
        
        if (response.body) {
            const text = await response.text();
            res.send(text);
        } else {
            res.end();
        }
    } catch (error: any) {
        console.error('Handler error:', error);
        res.status(500).json({ error: error.message });
    }
}