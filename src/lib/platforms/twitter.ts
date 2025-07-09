// src/lib/platforms/twitter.ts

import { TwitterAuthCodes } from '../../types/index.js';
import { setValueEx } from '../db.js'
import { randomBytes, createHash } from 'crypto';

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
    /**
    * Params required for confidential client Twitter auth request
    * response_type = code
    * client_id
    * redirect_uri
    * scope
    * state
    * code_challenge
    * code_challenge_method 
    */

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
        const prefix = 'twitter_pkce';
        const pkceData: TwitterAuthCodes = { codeVerifier, stateToken };
        const ttlInSeconds = 600; // 10 minutes;

        const dbSuccess = setValueEx(prefix, userId, pkceData, ttlInSeconds);

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

// const API_BASE_URL = process.env.VITE_API_BASE_URL;

//interface TokenResponse {
//    access_token: string;
//     token_type: string;
//     expires_in: number;
//     refresh_token: string;
//     scope: string;
// };
// 
// import { PostResult, TwitterAuthCodes } from '../../types/index.js';
// export class TwitterService {
//     private clientID: string | null = process.env.TWITTER_CLIENT_ID
//     private callbackURI: string | null = process.env.VITE_TWITTER_CALLBACK_URI
//     private accessToken: string | null = null;
//     private refreshToken: string | null = null;

//     constructor() {
//         // Get existing credentials if they exist

//         const twitterCredentials = TwitterStorageService.getTwitterLocalCredentials();
//         if (twitterCredentials) {
//             this.accessToken = twitterCredentials.accessToken;
//             this.refreshToken = twitterCredentials.refreshToken;
//         }
//     }

//     _logout(): void {
//       this.accessToken = null;
//       this.refreshToken = null;
//       TwitterStorageService.removeTwitterLocalCredentials();
//     }

//     // In services/twitter.ts

//     async logout(): Promise<void> {
//         // First, try to revoke the tokens on Twitter's end.
//         if (this.accessToken) {
//             try {
//                 const revokeEndpoint = `${API_BASE_URL}api/twitter-revoke-token`;
//                 await fetch(revokeEndpoint, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({
//                         token: this.accessToken,
//                         token_type_hint: 'access_token'
//                     })
//                 });
//                 // We can also try to revoke the refresh token if it exists
//                 if (this.refreshToken) {
//                     await fetch(revokeEndpoint, {
//                         method: 'POST',
//                         headers: { 'Content-Type': 'application/json' },
//                         body: JSON.stringify({
//                             token: this.refreshToken,
//                             token_type_hint: 'refresh_token'
//                         })
//                     });
//                 }
//             } catch (error) {
//                 // We log the error but don't stop the local logout process.
//                 console.error("Failed to revoke token, but proceeding with local logout.", error);
//             }
//         }

//         // ALWAYS perform the local logout, regardless of revocation success.
//         this.accessToken = null;
//         this.refreshToken = null;
//         TwitterStorageService.removeTwitterLocalCredentials();
//         console.log("Local Twitter logout complete.");
//     }


//     async createPost(text: string): Promise<PostResult> {
        
//         if (!this.accessToken) {
//             return { platform: 'twitter', success: false, error: 'Not authenticated' };
//         }

//         // Use local API proxy in development, or Vercel function in production
//         const tweetEndpoint = `${API_BASE_URL}api/twitter-tweet`
        
//         let response = await fetch(tweetEndpoint, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${this.accessToken}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({text: text})
//         });

//         if (response.status === 401) {
//             console.log("Token expired, attempting refresh...");
//             const success = await this._refreshAccessToken();

//             if (success) {
//                 // If refresh succeeded, retry the original request with the new token
//                 console.log("Retrying post with new token.");
//                 response = await fetch(tweetEndpoint, {
//                     method: 'POST',
//                     headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ text })
//                 });
//             } else {
//                 // If refresh failed, inform the user they need to log in again.
//                 return { platform: 'twitter', success: false, error: 'Session has expired. Please log in again.' };
//             }
//         }
        
//         if (!response.ok) {
//             const errorData = await response.json();
//             return { platform: 'twitter', success: false, error: `Post failed: ${errorData.title} || 'Unknown error'}`}
//         }
        
//         const data = await response.json();
        
//         return { platform: 'twitter', success: true, postId: data?.data?.id };        

//     }

//     isAuthenticated(): boolean {
//         return !!(this.accessToken && this.refreshToken);
//     }

//     async handleCallback(code: string, state: string): Promise<boolean> {
//         try {
//             // Receiving authorization code 
//             // Get stored session credentials
//             const sessionCreds = TwitterStorageService.getTwitterSessionCredentials();

//             // If sessionCreds is both empty or new (doesn't match our stored state) we have a problem
//             if (!sessionCreds || sessionCreds.stateToken !== state) {
//                 console.error(`State mismatch. From URL: "${state}", From Storage: "${sessionCreds?.stateToken}"`);
//                 throw new Error('Invalid state token'); // Checks for csrf attack; can also use for session storage for user
//             }

//             if (!sessionCreds.verifierCode) {
//                 throw new Error('Missing verifier code');
//             }

//             if (!this.clientID || !this.callbackURI) {
//                 throw new Error('Missing client ID or callback URI');
//             }

//             // Exchange code for tokens
//             const params = new URLSearchParams({
//                 code: code,
//                 grant_type: 'authorization_code',
//                 redirect_uri: this.callbackURI,
//                 code_verifier: sessionCreds.verifierCode
//             });

//             // Use local API proxy in development, or Vercel function in production
//             const tokenEndpoint = `${API_BASE_URL}api/twitter-token`
            
//             const response = await fetch(tokenEndpoint, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//                 body: params.toString()
//             });

//             if (!response.ok) {
//                 const errorText = await response.text();
//                 throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
//             }

//             const data: TokenResponse = await response.json();
            
//             // Store tokens
//             this.accessToken = data.access_token;
//             this.refreshToken = data.refresh_token;
            
//             const credentials: TwitterLocalCredentials = {
//                 accessToken: data.access_token,
//                 refreshToken: data.refresh_token || null
//             };
            
//             TwitterStorageService.saveTwitterLocalCredentials(credentials);
            
//             // Clear session storage
//             TwitterStorageService.clearTwitterSessionCredentials();
            
//             return true;
//         } catch (error) {
//             console.error('Twitter callback error:', error);
//             return false;
//         }
//     }

//     async _refreshAccessToken(): Promise<boolean> {
//         if (!this.refreshToken) {
//             console.error("Cannot refresh, no refresh token found.");
//             return false;
//         }

//         const params = new URLSearchParams({
//             refresh_token: this.refreshToken,
//             grant_type: 'refresh_token',
//         })

//         const tokenEndpoint = `${API_BASE_URL}api/twitter-token`
        
//         try {

//             const response = await fetch(tokenEndpoint, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//                 body: params.toString()
//             });
            
//             if (!response.ok) {
//                 console.error("Token refresh failed, logging out.");
//                 this.logout(); // Clear the bad tokens
//                 return false;
//             }
            
//             const data: TokenResponse = await response.json();
            
//             // Update the service's state with the new tokens
//             this.accessToken = data.access_token;
//             this.refreshToken = data.refresh_token;
            
//             TwitterStorageService.saveTwitterLocalCredentials({
//                 accessToken: this.accessToken,
//                 refreshToken: this.refreshToken,
//             });
//             console.log("Token refreshed successfully.");
//             return true;
//         } catch (error) {
//             console.error("Error during token refresh: ", error)
//             return false;
//         }


//     }
// }