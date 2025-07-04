import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // We are expecting a JSON body from our frontend service
    const { token, token_type_hint } = request.body;
    if (!token || !token_type_hint) {
      return response.status(400).json({ error: 'Missing token or token_type_hint' });
    }

    const CLIENT_ID = process.env.VITE_TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Twitter client ID or secret is not configured.');
    }

    // Confidential clients authenticate with Basic Auth
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const revokeResponse = await fetch('https://api.twitter.com/2/oauth2/revoke', {
      method: 'POST',
      headers: {
        // The Content-Type must be 'application/x-www-form-urlencoded'
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      // The body must be URL-encoded, not JSON
      body: new URLSearchParams({
        token: token,
        token_type_hint: token_type_hint,
      }),
    });

    const data = await revokeResponse.json();

    if (!revokeResponse.ok) {
      console.warn('Token revocation may have failed, but proceeding with local logout.', data);
    }
    
    // Always respond to the frontend that the attempt was made
    return response.status(200).json(data);

  } catch (error) {
    console.error('Internal Server Error in token revocation:', error);
    return response.status(500).json({ error: 'An unexpected error occurred.' });
  }
}