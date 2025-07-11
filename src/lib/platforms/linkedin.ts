import { randomBytes } from 'crypto';
import { DB_KEYS } from '../../types/index.js';
import type { PostResult, LinkedInTokens, LinkedInAuthCodes } from '../../types/index.js';
import { getValue, setValue, setValueEx } from '../db.js';

// --- Environment Variable Validation ---
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const CALLBACK_URI = process.env.LINKEDIN_CALLBACK_URI;


function _generateStateToken(): string {
    return `linkedin-${randomBytes(16).toString('hex')}`;
}


export async function startLoginProcess(userId: string): Promise<string | null> {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URI) {
        throw new Error('Missing one or more required LinkedIn environment variables.');
}
    try {
        const state = _generateStateToken();

        const data: LinkedInAuthCodes = { stateToken: state };
        await setValueEx(DB_KEYS.LINKEDIN_CODES, userId, data, 500); // 5-minute expiry

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            redirect_uri: CALLBACK_URI,
            state: state,
            scope: 'openid profile email w_member_social',
        });

        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    } catch (error) {
        console.error("Error starting LinkedIn login process:", error);
        return null;
    }
}

export async function handleLinkedInCallback(code: string, state: string, userId: string): Promise<boolean> {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URI) {
        throw new Error('Missing one or more required LinkedIn environment variables.');
    }

    const storedCodes = await getValue<LinkedInAuthCodes>(DB_KEYS.LINKEDIN_CODES, userId);
    if (!storedCodes || storedCodes.stateToken !== state) {
        throw new Error('Invalid state token or session expired.');
    }

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: CLIENT_ID as string,       
        client_secret: CLIENT_SECRET as string, 
        redirect_uri: CALLBACK_URI as string
    });

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });


    if (!tokenResponse.ok) {
        // The error from LinkedIn will be in the response body.
        const errorData = await tokenResponse.json();
        // Log the specific error for better debugging.
        console.error("LinkedIn Token Exchange Error:", errorData);
        throw new Error(`LinkedIn token exchange failed: ${errorData.error_description}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in, id_token } = tokenData;

    // Decode the id_token to get the user's Person URN (sub claim)
    const idTokenPayload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
    const personUrn = `urn:li:person:${idTokenPayload.sub}`;

    if (!personUrn || !idTokenPayload.sub) {
        throw new Error("Could not extract Person URN from ID token.");
    }

    const tokensToStore: LinkedInTokens = {
        accessToken: access_token,
        personUrn: personUrn,
        expiresAt: Date.now() + (expires_in * 1000),
    };

    return setValue(DB_KEYS.LINKEDIN_TOKENS, userId, tokensToStore);
}

export async function postToLinkedInForUser(userId: string, text: string): Promise<PostResult> {
    try {
        const tokens = await getValue<LinkedInTokens>(DB_KEYS.LINKEDIN_TOKENS, userId);
        if (!tokens?.accessToken || !tokens.personUrn) {
            throw new Error("User is not authenticated with LinkedIn.");
        }

        const requestBody = {
            author: tokens.personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text },
                    shareMediaCategory: 'NONE',
                },
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
        };

        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0', // Critical header for this API
            },
            body: JSON.stringify(requestBody),
        });

        if (response.status !== 201) { // LinkedIn returns 201 Created on success
            const errorData = await response.json();
            throw new Error(`LinkedIn API error: ${errorData.message}`);
        }
        
        const postId = response.headers.get('x-restli-id') || '';
        return { platform: 'linkedin', success: true, postId };

    } catch (error: any) {
        console.error("Error posting to LinkedIn:", error);
        return { platform: 'linkedin', success: false, error: error.message };
    }
}