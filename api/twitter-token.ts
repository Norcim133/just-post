export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the body as a string (Vercel parses it as an object)
    const bodyString = typeof req.body === 'string' 
      ? req.body 
      : new URLSearchParams(req.body).toString();

    console.log('Proxying request to Twitter with body:', bodyString);

    // Get client credentials from environment variables
    const clientId = process.env.VITE_TWITTER_CLIENT_ID;
    const clientSecret = process.env.VITE_TWITTER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Twitter client credentials not configured');
    }
    
    // Create Basic Auth header
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Forward the request to Twitter's token endpoint
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: bodyString,
    });

    const data = await response.json();
    console.log('Twitter response:', response.status, data);

    // Return the same status code as Twitter
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Twitter token proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}