import { setValue, getValue, setValueEx, deleteValue } from '../db.js';
import { DB_KEYS } from '../../types/index.js';
import type { PostResult, ThreadsTokens, ThreadsCodes, ThreadsTokenResponse } from '../../types/index.js';
import { randomBytes } from 'crypto';

const CLIENT_ID = process.env.THREADS_CLIENT_ID;
const CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET;
const CALLBACK_URI = process.env.THREADS_CALLBACK_URI; //NOTE had to be https

function _generateStateToken(): string {
    return `threads-${randomBytes(16).toString('hex')}`;
}

export async function startLoginProcess(userId: string): Promise<string | null> {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URI) throw new Error("Missing Threads App ID, Secret or Callback URI.");
    try {

        const state = _generateStateToken()
        
        const data: ThreadsCodes = { stateToken: state };
        await setValueEx(DB_KEYS.THREADS_CODES, userId, data, 300); // 5-minute expiry
        
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            redirect_uri: CALLBACK_URI,
            scope: 'threads_basic,threads_content_publish',
            response_type: 'code',
            state: state,
        });
        return `https://threads.net/oauth/authorize?${params.toString()}`;

    } catch (error) {
        console.error("Error starting Threads login process:", error);
        return null;
    }
}

export async function handleThreadsCallback(code: string, state: string, userId: string): Promise<boolean> {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URI) throw new Error("Missing Threads App ID, Secret or Callback URI.");
    
    // Verify state
    const storedState = await getValue<ThreadsCodes>(DB_KEYS.THREADS_CODES, userId);
    if (!storedState || storedState.stateToken !== state ) throw new Error(`Invalid or expired state token with token: ${storedState?.stateToken} and state: ${state}`);

    const cleanCode = code.replace(/#_$/, ''); // Docs require you to strip last 2 characters

    // ---- STEP 1: Exchange Code for SHORT-LIVED Token ----
    const shortLivedParams = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: cleanCode,
        grant_type: 'authorization_code',
        redirect_uri: CALLBACK_URI,
    });

    let shortRes = await fetch('https://graph.threads.net/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: shortLivedParams.toString(),
    });

    if (!shortRes.ok) throw new Error(`Threads short-lived token exchange failed: ${await shortRes.text()}`);
    
    //Have to parse as raw string to avoid issues with very large numbers
    const rawText = await shortRes.text();

    // 2. Use a regular expression to reliably extract the user_id as a STRING.
    const userIdMatch = rawText.match(/"user_id":\s*(\d+)/);
    const threadsUserId = userIdMatch ? userIdMatch[1] : null;

    if (!threadsUserId) {
        throw new Error("Could not extract user_id from Threads API response.");
    }

    const shortLivedData = JSON.parse(rawText);
    const shortLivedToken = shortLivedData.access_token;


    // ---- STEP 2: Exchange Short-lived for LONG-LIVED Token ----
    const longLivedParams = new URLSearchParams({
        client_secret: CLIENT_SECRET,
        grant_type: 'th_exchange_token',
        access_token: shortLivedToken,
    });

    const longRes = await fetch(`https://graph.threads.net/access_token?${longLivedParams.toString()}`);

    if (!longRes.ok) throw new Error(`Threads long-lived token exchange failed: ${await longRes.text()}`);

    const longLivedData = await longRes.json();
    
    const tokensToStore: ThreadsTokens = {
        accessToken: longLivedData.access_token,
        userId: threadsUserId,
        expiresAt: Date.now() + (longLivedData.expires_in * 1000), 
    };

    return setValue(DB_KEYS.THREADS_TOKENS, userId, tokensToStore);
}

async function _refreshAccessToken(userId: string, threadsUserId: string, accessToken: string): Promise<ThreadsTokens | null> {
    const body = new URLSearchParams({
        grant_type: 'th_refresh_token',
        access_token: accessToken
    });

    // If token is close to expiry, refresh it
    const response = await fetch('https://graph.threads.net/refresh_access_token', {
        method: "GET",
        body: body.toString()
    });

    if (!response.ok) {
        console.error("Threads token refresh failed. Deleting invalid tokens.");
        // If refresh fails, the tokens are bad. Delete them
        await deleteValue(DB_KEYS.THREADS_TOKENS, userId);
        return null;
    }

    const tokenData: ThreadsTokenResponse = await response.json();
    const newTokens: ThreadsTokens = {
        accessToken: tokenData.access_token,
        userId: threadsUserId,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
    };

    // Save the shiny new tokens
    await setValue(DB_KEYS.THREADS_TOKENS, userId, newTokens);
    return newTokens;
}

export async function verifyThreadsAuthentication(userId: string): Promise<boolean> {
    const tokens = await getValue<ThreadsTokens>(DB_KEYS.THREADS_TOKENS, userId);

    if (!tokens || !tokens.accessToken) {
        return false; // No tokens or no refresh token means not connected
    }

    // Quick check: if token is fresh, assume it's valid to save an API call
    // 1 day = 86,400,000 milliseconds
    if (tokens.expiresAt && Date.now() < tokens.expiresAt - 86400000) {
        return true;
    }

    console.log('Threads access token expired, attempting refresh...');
    const newTokens = await _refreshAccessToken(userId, tokens.userId, tokens.accessToken);
    return !!newTokens; // Return true if refresh succeeded, false otherwise.
}

export async function postToThreadsForUser(userId: string, text: string): Promise<PostResult> {
    try {
        
        const isConnected = await verifyThreadsAuthentication(userId);
        if (!isConnected) {
            throw new Error("User not connected to Threads or token has expired.");
        }

        const tokens = await getValue<ThreadsTokens>(DB_KEYS.THREADS_TOKENS, userId);
        if (!tokens || !tokens.accessToken || !tokens.userId) {
            throw new Error(`Could not retrieve valid Threads credentials after verification; token: ${tokens?.accessToken}`);
        }

        // ---- STEP 1: Create Media Container ----
        const containerParams = new URLSearchParams({
            media_type: 'TEXT',
            text: text,
            access_token: tokens.accessToken,
        });

        const res = await fetch(`https://graph.threads.net/v1.0/${tokens.userId}/threads?${containerParams.toString()}`, {
            method: 'POST',
        });

        if (!res.ok) {
            throw new Error(`Threads container creation failed: ${await res.text()}`);
        }

        const containerData = await res.json();
        const creationId = containerData.id;

        // ---- STEP 2: Publish Media Container ----
        // It's recommended to wait briefly before publishing.
        await new Promise(resolve => setTimeout(resolve, 1000));

        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: tokens.accessToken,
        });


        const publishRes = await fetch(`https://graph.threads.net/v1.0/${tokens.userId}/threads_publish?${publishParams.toString()}`, {
            method: 'POST',
        });

        if (!publishRes.ok) {
            throw new Error(`Threads publishing failed: ${await publishRes.text()}`);
        }
        
        const publishData = await publishRes.json();
        return { platform: 'threads', success: true, postId: publishData.id };

    } catch (error: any) {
        return { platform: 'threads', success: false, error: error.message };
    }
}