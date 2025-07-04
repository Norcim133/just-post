import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const requestBody = request.body;
    
    // Create a new URLSearchParams object from the request body
    const params = new URLSearchParams(requestBody);

    const grantType = params.get('grant_type');

    if (grantType !== 'authorization_code' && grantType !== 'refresh_token') {
        return response.status(400).json({ error: 'Invalid grant_type' });
    }

    const CLIENT_ID = process.env.VITE_TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Twitter client ID or secret is not configured in environment variables.');
    }

    // 2. Create the Basic Auth header from the Client ID and Client Secret.
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');


    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: params.toString(),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Twitter Token Exchange Error:', data);
      return response.status(tokenResponse.status).json(data);
    }
    
    return response.status(200).json(data);

  } catch (error) {
    console.error('Internal Server Error in token exchange:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return response.status(500).json({ error: message });
  }
}