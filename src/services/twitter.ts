import { PostResult, TwitterLocalCredentials, TwitterSessionCredentials } from '../types';
import { TwitterStorageService } from './storage';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class TwitterService {
    private clientID: string | null = import.meta.env.TWITTER_CLIENT_ID
    private callbackURI: string | null = import.meta.env.VITE_TWITTER_CALLBACK_URI
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        // Get existing credentials if they exist
        const twitterCredentials = TwitterStorageService.getTwitterLocalCredentials();
        if (twitterCredentials) {
            this.accessToken = twitterCredentials.accessToken;
            this.refreshToken = twitterCredentials.refreshToken;
        }
    }

    _logout(): void {
      this.accessToken = null;
      this.refreshToken = null;
      TwitterStorageService.removeTwitterLocalCredentials();
    }

    // In services/twitter.ts

    async logout(): Promise<void> {
        // First, try to revoke the tokens on Twitter's end.
        if (this.accessToken) {
            try {
                const revokeEndpoint = `${API_BASE_URL}api/twitter-revoke-token`;
                await fetch(revokeEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: this.accessToken,
                        token_type_hint: 'access_token'
                    })
                });
                // We can also try to revoke the refresh token if it exists
                if (this.refreshToken) {
                    await fetch(revokeEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: this.refreshToken,
                            token_type_hint: 'refresh_token'
                        })
                    });
                }
            } catch (error) {
                // We log the error but don't stop the local logout process.
                console.error("Failed to revoke token, but proceeding with local logout.", error);
            }
        }

        // ALWAYS perform the local logout, regardless of revocation success.
        this.accessToken = null;
        this.refreshToken = null;
        TwitterStorageService.removeTwitterLocalCredentials();
        console.log("Local Twitter logout complete.");
    }


    async login() {
        // Triggered by user as opposed to refresh
        let sessionCreds: TwitterSessionCredentials | null = TwitterStorageService.getTwitterSessionCredentials();

        if (!sessionCreds) {
            const verifierCode = await this._generateVerifierCode();
            if (!verifierCode) throw new Error('Failed to generate verifier code');
            
            const challengeCode = await this._generateChallengeCode(verifierCode);
            if (!challengeCode) throw new Error('Failed to generate challenge code');
            
            // State token has platform id so we can handle future platforms
            const stateToken = this._generateStateToken();

            sessionCreds = {
                verifierCode: verifierCode,
                challengeCode: challengeCode,
                stateToken: stateToken
            };

            TwitterStorageService.saveTwitterSessionCredentials(sessionCreds);
        }

        if (!this.clientID || !this.callbackURI) {
            throw new Error('Client ID or Callback URI required');
        }

        if (!sessionCreds?.stateToken || !sessionCreds?.challengeCode) {
            throw new Error("Critical error: Session credentials could not be established for login.");
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientID,
            redirect_uri: this.callbackURI,
            scope: 'tweet.read tweet.write users.read offline.access',
            state: sessionCreds.stateToken,
            code_challenge: sessionCreds.challengeCode,
            code_challenge_method: 'S256'
        });

        const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;
        
        window.location.href = authUrl;
    }

    async createPost(text: string): Promise<PostResult> {
        
        if (!this.accessToken) {
            return { platform: 'twitter', success: false, error: 'Not authenticated' };
        }

        // Use local API proxy in development, or Vercel function in production
        const tweetEndpoint = `${API_BASE_URL}api/twitter-tweet`
        
        let response = await fetch(tweetEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text: text})
        });

        if (response.status === 401) {
            console.log("Token expired, attempting refresh...");
            const success = await this._refreshAccessToken();

            if (success) {
                // If refresh succeeded, retry the original request with the new token
                console.log("Retrying post with new token.");
                response = await fetch(tweetEndpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
            } else {
                // If refresh failed, inform the user they need to log in again.
                return { platform: 'twitter', success: false, error: 'Session has expired. Please log in again.' };
            }
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            return { platform: 'twitter', success: false, error: `Post failed: ${errorData.title} || 'Unknown error'}`}
        }
        
        const data = await response.json();
        
        return { platform: 'twitter', success: true, postId: data?.data?.id };        

    }

    isAuthenticated(): boolean {
        return !!(this.accessToken && this.refreshToken);
    }

    async handleCallback(code: string, state: string): Promise<boolean> {
        try {
            // Receiving authorization code 
            // Get stored session credentials
            const sessionCreds = TwitterStorageService.getTwitterSessionCredentials();

            // If sessionCreds is both empty or new (doesn't match our stored state) we have a problem
            if (!sessionCreds || sessionCreds.stateToken !== state) {
                console.error(`State mismatch. From URL: "${state}", From Storage: "${sessionCreds?.stateToken}"`);
                throw new Error('Invalid state token'); // Checks for csrf attack; can also use for session storage for user
            }

            if (!sessionCreds.verifierCode) {
                throw new Error('Missing verifier code');
            }

            if (!this.clientID || !this.callbackURI) {
                throw new Error('Missing client ID or callback URI');
            }

            // Exchange code for tokens
            const params = new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: this.callbackURI,
                code_verifier: sessionCreds.verifierCode
            });

            // Use local API proxy in development, or Vercel function in production
            const tokenEndpoint = `${API_BASE_URL}api/twitter-token`
            
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
            }

            const data: TokenResponse = await response.json();
            
            // Store tokens
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            
            const credentials: TwitterLocalCredentials = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || null
            };
            
            TwitterStorageService.saveTwitterLocalCredentials(credentials);
            
            // Clear session storage
            TwitterStorageService.clearTwitterSessionCredentials();
            
            return true;
        } catch (error) {
            console.error('Twitter callback error:', error);
            return false;
        }
    }

    async _refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) {
            console.error("Cannot refresh, no refresh token found.");
            return false;
        }

        const params = new URLSearchParams({
            refresh_token: this.refreshToken,
            grant_type: 'refresh_token',
        })

        const tokenEndpoint = `${API_BASE_URL}api/twitter-token`
        
        try {

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });
            
            if (!response.ok) {
                console.error("Token refresh failed, logging out.");
                this.logout(); // Clear the bad tokens
                return false;
            }
            
            const data: TokenResponse = await response.json();
            
            // Update the service's state with the new tokens
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            
            TwitterStorageService.saveTwitterLocalCredentials({
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
            });
            console.log("Token refreshed successfully.");
            return true;
        } catch (error) {
            console.error("Error during token refresh: ", error)
            return false;
        }


    }

    async _generateVerifierCode(): Promise<string | null> {
        try{
            const randomBytes = new Uint8Array(32);
            window.crypto.getRandomValues(randomBytes);
            const base64String = btoa(String.fromCharCode(...randomBytes));
            return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        catch (error) {
            console.error('Error generating twitter verifier code')
            return null
        }
    }

    async _generateChallengeCode(verifierCode: string | null): Promise<string | null> {
        try {
            if (!verifierCode) {
                return null
            }
            const encoder = new TextEncoder();
            const data = encoder.encode(verifierCode);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashString = String.fromCharCode(...hashArray);
            const base64Hash = btoa(hashString);
            return base64Hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        catch (error) {
            console.error('Error generating twitter challenge code:', error);
            return null;
        }
    }

    _generateStateToken(): string {
        // Add our platform id so our useEffects can distinguish platform calling back
        const stateData = {
            platform: 'twitter',
            nonce: Math.random().toString(36).substring(2)
        };
        // Encode the JSON
        const encodedJson = btoa(JSON.stringify(stateData));
        
        // Add our unique prefix
        const stateToken = `justpost-${encodedJson}`;
        return stateToken;
    }
}