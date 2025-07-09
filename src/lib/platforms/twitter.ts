// src/lib/platforms/twitter.ts

import { randomBytes, createHash } from 'crypto';
import { getValue, setValue, deleteValue, setValueEx } from '../db.js';
import { DB_KEYS } from '../../types/index.js';
import type { TwitterTokens, TwitterTokenResponse, TwitterAuthCodes, PostResult } from '../../types/index.js';

// Get these from env once at the top level
const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');


async function _generateCodeVerifier(): Promise<string | null> {
    try{
        const buffer = randomBytes(32);
        // Convert to a Base64 string and make it URL-safe
        return buffer.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    catch (error) {
        console.error('Error generating twitter code verifier')
        return null
    }
}

async function _generateCodeChallenge(codeVerifier: string | null): Promise<string | null> {
    if (!codeVerifier) {
        console.error('generateCodeChallenge did not receive a code verifier')
        return null
    }

    try {
        const hash = createHash('sha256').update(codeVerifier).digest();
        // Convert hash to Base64 and make it URL-safe
        return hash.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    catch (error) {
        console.error('Error generating twitter code challange:', error);
        return null;
    }
}

function _generateStateToken(): string {
    // Add our platform id so our useEffects can distinguish platform calling back
    const stateData = {
        platform: 'twitter',
        nonce: randomBytes(8).toString('hex')
    };
    // Encode the JSON
    const encodedJson = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Add our unique prefix
    const stateToken = `justpost-${encodedJson}`;
    return stateToken;
}

export async function startLoginProcess(userId: string): Promise<string | null> {

    try {
        const clientId = process.env.TWITTER_CLIENT_ID

        if (!clientId) {
            console.error('Missing Twitter clientId in env');
            return null;
        }

        const redirectUri = process.env.TWITTER_CALLBACK_URI

        if (!redirectUri) {
            console.error('Missing Twitter redirect Uri in env');
            return null;
        }

        const codeVerifier = await _generateCodeVerifier();

        if (!codeVerifier) {
            console.error('Error generating Twitter verifier code');
            return null;
        }

        const codeChallenge = await _generateCodeChallenge(codeVerifier);

        if (!codeChallenge) {
            console.error('Error generating Twitter codeChallenge');
            return null;
        }

        const stateToken = _generateStateToken();

        if (!stateToken) {
            console.error('Error generating Twitter stateToken');
            return null;
        }

        // Temp save credentials
        const prefix = DB_KEYS.TWITTER_PKCE;
        const pkceData: TwitterAuthCodes = { codeVerifier, stateToken };
        const ttlInSeconds = 600; // 10 minutes;

        const dbSuccess = await setValueEx(prefix, userId, pkceData, ttlInSeconds);

        if (!dbSuccess) {
            console.error('Error saving Twitter auth codes to db')
            return null
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'tweet.read tweet.write users.read offline.access', // offline.access required for refresh tokens
            state: stateToken,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

        return authUrl

    } catch (error: any) {
        console.error('Unable to create Twitter authUrl')
        return null
    }
}


async function _refreshAccessToken(userId: string, refreshToken: string): Promise<TwitterTokens | null> {
    const params = new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });

    const response = await fetch('https://api.x.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`, // This was missing
        },
        body: params.toString(),
    });

    if (!response.ok) {
        console.error("Twitter token refresh failed. Deleting invalid tokens.");
        // If refresh fails, the tokens are bad. Delete them
        await deleteValue(DB_KEYS.TWITTER_TOKENS, userId);
        return null;
    }

    const tokenData: TwitterTokenResponse = await response.json();
    const newTokens: TwitterTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
    };

    // Save the shiny new tokens
    await setValue(DB_KEYS.TWITTER_TOKENS, userId, newTokens);
    return newTokens;
}

/**
 * Verifies that the user's Twitter tokens are still valid.
 * If the access token is expired, it attempts to refresh it.
 * @returns True if the user has valid, active tokens, otherwise false.
 */
export async function verifyTwitterAuthentication(userId: string): Promise<boolean> {
    const tokens = await getValue<TwitterTokens>(DB_KEYS.TWITTER_TOKENS, userId);

    if (!tokens?.refreshToken) {
        return false; // No tokens or no refresh token means not connected
    }

    // Quick check: if token is fresh, assume it's valid to save an API call
    // 5 minutes = 300,000 milliseconds
    if (tokens.expiresAt && Date.now() < tokens.expiresAt - 300000) {
        return true;
    }

    // If token is close to expiry, verify it with a lightweight API call
    const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
    });

    if (response.ok) {
        return true; // Token is still good.
    }

    if (response.status === 401) {
        // Token is expired or revoked, try to refresh
        console.log('Twitter access token expired, attempting refresh...');
        const newTokens = await _refreshAccessToken(userId, tokens.refreshToken);
        return !!newTokens; // Return true if refresh succeeded, false otherwise.
    }

    // For any other errors (e.g., 403, 500), assume invalid
    return false;
}

 async function _revokeToken(token: string, token_type_hint: 'access_token' | 'refresh_token') {
    const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    try {
        await fetch('https://api.twitter.com/2/oauth2/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({ token, token_type_hint }),
        });
        console.log(`Successfully revoked Twitter ${token_type_hint}.`);
    } catch (error) {
        // Log the error but don't stop the logout process.
        console.warn(`Could not revoke Twitter ${token_type_hint}. This is non-critical.`, error);
    }
}

export async function postToTwitterForUser(userId: string, text: string): Promise<PostResult> {
    try {
        // 1. Verify tokens are valid and refresh them if necessary.
        const isVerified = await verifyTwitterAuthentication(userId);
        if (!isVerified) {
            throw new Error("User is not authenticated with Twitter or tokens are invalid.");
        }

        // 2. Get the (potentially refreshed) tokens from the database.
        const tokens = await getValue<TwitterTokens>(DB_KEYS.TWITTER_TOKENS, userId);
        if (!tokens?.accessToken) {
            throw new Error("Could not retrieve valid access token after verification.");
        }

        // 3. Make the API call to create the tweet.
        const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to post to Twitter: ${errorData.title || 'Unknown API error'}`);
        }

        const data = await response.json();
        return { platform: 'twitter', success: true, postId: data?.data?.id };

    } catch (error: any) {
        console.error("Error in postToTwitterForUser service:", error);
        return { platform: 'twitter', success: false, error: error.message };
    }
}

export async function logoutFromTwitterForUser(userId: string): Promise<boolean> {
    const tokens = await getValue<TwitterTokens>(DB_KEYS.TWITTER_TOKENS, userId);

    if (tokens && tokens.accessToken) {
        // Best effort: try to revoke the tokens with Twitter's API first
        // Do in parallel to speed it up
        await Promise.all([
            _revokeToken(tokens.accessToken, 'access_token'),
            tokens.refreshToken ? _revokeToken(tokens.refreshToken, 'refresh_token') : Promise.resolve()
        ]);
    }

    // Always delete the tokens from our database, regardless of revocation success
    const deleted = await deleteValue(DB_KEYS.TWITTER_TOKENS, userId);
    return deleted;
}