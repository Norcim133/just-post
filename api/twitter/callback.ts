import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionOrUnauthorized } from '../../src/lib/request-helper.js';
import { getValue, setValue } from '../../src/lib/db.js'
import { TwitterAuthCodes, TwitterTokens, TwitterTokenResponse ,DB_KEYS } from '../../src/types/index.js'


const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_CALLBACK_URI = process.env.TWITTER_CALLBACK_URI

export default async function handleCallback(req: VercelRequest, res: VercelResponse) {
    if (!CLIENT_ID || !CLIENT_SECRET || !TWITTER_CALLBACK_URI) {
        throw new Error('Missing one or more required Twitter environment variables.');
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    
    
    try {
        const session = await getSessionOrUnauthorized(req, res)
        if (!session) return;

        const { state, code, error: twitterError } = req.query;

        if (twitterError) {
            console.warn(`Twitter returned an error: ${twitterError}`);
            return res.status(400).json({ error: `Twitter authorization failed: ${twitterError}` });
        }

        if (!state || !code || typeof state !== 'string' || typeof code !== 'string') {
            return res.status(400).json({ error: 'Invalid callback request: missing state or code.' });
        }

        const pkcePrefix = DB_KEYS.TWITTER_PKCE;
        const authCodes = await getValue<TwitterAuthCodes>(pkcePrefix, session.user.id)

        if (!authCodes || authCodes.stateToken !== state) {
            console.error(`Invalid state token. state: ${state} does not match stateToken: ${authCodes?.stateToken}`)
            return res.status(403).json({ error: 'Invalid state token. Authorization failed.' });
        }

        const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const params = new URLSearchParams({
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: TWITTER_CALLBACK_URI,
            code_verifier: authCodes.codeVerifier
        });

            
        const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: params.toString()
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error(`Twitter token exchange failed: ${tokenResponse.status} - ${errorText}`);
            throw new Error('Failed to exchange authorization code for tokens.');
        }

        const tokenData: TwitterTokenResponse = await tokenResponse.json();
                
        const tokensToStore: TwitterTokens = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
        };
        
        const dbSuccess = await setValue<TwitterTokens>(DB_KEYS.TWITTER_TOKENS, session.user.id, tokensToStore)

        if (!dbSuccess) {
            throw new Error('Failed to save authentication tokens to the database.');
        }
        
        const baseUri = process.env.VITE_API_BASE_URL
        if (!baseUri) {
            throw new Error('No base URI set in env')
        }

        return res.redirect(baseUri);

    } catch (error: any) {
        console.error("Error handling callback from Twitter: ", error);
        return res.redirect('/?error=twitter_login_failed');
    }
}