import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // We only want to handle POST requests to this endpoint
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Get the Authorization header from the incoming request
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const accessToken = authHeader.split(' ')[1];

    // 2. Get the post text from the request body
    const { text } = request.body;
    if (!text) {
      return response.status(400).json({ error: 'Bad Request: Missing post text' });
    }

    // 3. Make the actual request to the Twitter API
    const twitterApiResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ text: text }),
    });

    // 4. Check if the request to Twitter was successful
    if (!twitterApiResponse.ok) {
      // If Twitter returned an error, parse it and forward it
      const errorData = await twitterApiResponse.json();
      console.error('Twitter API Error:', errorData);
      return response.status(twitterApiResponse.status).json({
        error: 'Failed to post to Twitter',
        details: errorData,
      });
    }

    // 5. If successful, parse the response from Twitter and send it back to our frontend
    const data = await twitterApiResponse.json();
    return response.status(200).json(data);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'An unexpected error occurred.' });
  }
}