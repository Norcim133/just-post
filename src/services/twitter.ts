import { TwitterLocalCredentials, TwitterSessionCredentials } from '../types';
import { TwitterStorageService } from './storage';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
};

interface PostResponse {
    platform: string;
    success: boolean;
    data: string;
};

export class TwitterService {
    private clientID: string | null = import.meta.env.VITE_TWITTER_CLIENT_ID
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

    async login() {
        // Assume if we're calling login, isAuthenticated was checked and returned false

        // Create verifier code
        const verifierCode = await this._generateVerifierCode();
        if (!verifierCode) {
            throw new Error('Failed to generate verifier code');
        }
        
        // Create challengeCode
        const challengeCode = await this._generateChallengeCode(verifierCode);
        if (!challengeCode) {
            throw new Error('Failed to generate challenge code');
        }

        const stateToken = this._generateStateToken();

        const credentials: TwitterSessionCredentials = {
            verifierCode: verifierCode,
            challengeCode: challengeCode,
            stateToken: stateToken
        }

        // Save to sessionStorage
        TwitterStorageService.saveTwitterSessionCredentials(credentials)

        if (!this.clientID) {
            throw new Error('Client ID is required');
        }
        if (!this.callbackURI) {
            throw new Error('Callback URI required');
        }
        // Attempt authorization request... ,
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientID,
            redirect_uri: this.callbackURI,
            scope: 'tweet.read tweet.write users.read offline.access', // offline.access required to receive refresh token on top of access token
            state: stateToken,
            code_challenge: challengeCode,  // Now guaranteed to be string
            code_challenge_method: 'S256'
        });

        const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;
    
        // Redirect the user to X's authorization page
        window.location.href = authUrl;
    }

    async createTwitterPost(text: string): Promise<PostResponse> {
        try {
            if (!this.accessToken) {
                throw new Error('Not authenticated with Twitter');
            }

            // Use local API proxy in development, or Vercel function in production
            const tweetEndpoint = import.meta.env.DEV 
                ? '/api/twitter-tweet' 
                : '/api/twitter-tweet';
            
            const response = await fetch(tweetEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text
                })
            });
            
            if (!response.ok) {
                throw new Error(`Post failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return {
                platform: 'twitter',
                success: true,
                data: data.uri,
            };
        } catch (error) {
            console.error('Twitter post error:', error);
            return {
                platform: 'twitter',
                success: false,
                data: error instanceof Error ? error.message : 'Unknown error',
            };
        }
        

    }

    isAuthenticated(): boolean {
        return !!(this.accessToken && this.refreshToken);
    }

    async handleCallback(code: string, state: string): Promise<boolean> {
        try {
            // Receiving authorization code 
            // Get stored session credentials
            const sessionCreds = TwitterStorageService.getTwitterSessionCredentials();
            if (!sessionCreds || sessionCreds.stateToken !== state) {
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
                client_id: this.clientID,
                redirect_uri: this.callbackURI,
                code_verifier: sessionCreds.verifierCode
            });

            // Use local API proxy in development, or Vercel function in production
            const tokenEndpoint = import.meta.env.DEV 
                ? '/api/twitter-token' 
                : '/api/twitter-token';
            
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

    async _refreshAccessToken(): Promise<TokenResponse> {
        if (!this.refreshToken || !this.clientID) {
            throw new Error('Missing refresh token or client ID');
        }

        const params = new URLSearchParams({
            refresh_token: this.refreshToken,
            grant_type: 'refresh_token',
            client_id: this.clientID
        })

        // Use local API proxy in development, or Vercel function in production
        const tokenEndpoint = import.meta.env.DEV 
            ? '/api/twitter-token' 
            : '/api/twitter-token';
            
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
        }

        const data: TokenResponse = await response.json();
        return data;

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
        // Generate a random state token for CSRF protection
        // Generate a nonce and compare it on the redirect from the auth server
        // Can use it to store or find reference to the user's session (i.e. where use left)
        const stateData = {
            platform: 'twitter',
            nonce: Math.random().toString(36).substring(2) // The random part for CSRF
        };
        const stateToken = btoa(JSON.stringify(stateData));
        return stateToken
    }
}