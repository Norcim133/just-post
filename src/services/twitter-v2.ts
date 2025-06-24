import { TwitterSessionCredentials } from '../types';
import { TwitterStorageService } from '../services/storage';
import { apiService } from './api';
import { useAuth0 } from '@auth0/auth0-react';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

interface PostResponse {
    platform: string;
    success: boolean;
    data: string;
}

export class TwitterServiceV2 {
    private clientID: string | null = import.meta.env.VITE_TWITTER_CLIENT_ID;
    private callbackURI: string | null = import.meta.env.VITE_TWITTER_CALLBACK_URI;
    private userId: string | null = null;
    private isConnected: boolean = false;

    constructor() {
        // Client-side service no longer stores tokens
    }

    setUserId(userId: string) {
        this.userId = userId;
    }

    async checkConnection(): Promise<boolean> {
        try {
            const tokens = await apiService.getTokens('twitter');
            this.isConnected = !!tokens;
            return this.isConnected;
        } catch (error) {
            console.error('Failed to check Twitter connection:', error);
            this.isConnected = false;
            return false;
        }
    }

    async login() {
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

        // Create stateToken
        const stateToken = this._generateStateToken();

        const credentials: TwitterSessionCredentials = {
            verifierCode: verifierCode,
            challengeCode: challengeCode,
            stateToken: stateToken
        }
        // Save to sessionStorage (still needed for OAuth flow)
        TwitterStorageService.saveTwitterSessionCredentials(credentials);

        if (!this.clientID) {
            throw new Error('Client ID is required');
        }
        if (!this.callbackURI) {
            throw new Error('Callback URI required');
        }
        
        // Attempt authorization request
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientID,
            redirect_uri: this.callbackURI,
            scope: 'tweet.read tweet.write users.read offline.access',
            state: stateToken,
            code_challenge: challengeCode,
            code_challenge_method: 'S256'
        });

        const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;
    
        // Redirect the user to X's authorization page
        window.location.href = authUrl;
    }

    async createTwitterPost(text: string): Promise<PostResponse> {
        try {
            const data = await apiService.postToTwitter(text);
            
            return {
                platform: 'twitter',
                success: true,
                data: data.data?.id || data.uri || 'Posted successfully',
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
        return this.isConnected;
    }

    async handleCallback(code: string, state: string): Promise<boolean> {
        try {
            // Get stored session credentials
            const sessionCreds = TwitterStorageService.getTwitterSessionCredentials();
            if (!sessionCreds || sessionCreds.stateToken !== state) {
                throw new Error('Invalid state token');
            }

            if (!sessionCreds.verifierCode) {
                throw new Error('Missing verifier code');
            }

            if (!this.clientID || !this.callbackURI) {
                throw new Error('Missing client ID or callback URI');
            }

            if (!this.userId) {
                throw new Error('User ID not set');
            }

            // Exchange code for tokens
            const params = {
                code: code,
                grant_type: 'authorization_code',
                client_id: this.clientID,
                redirect_uri: this.callbackURI,
                code_verifier: sessionCreds.verifierCode
            };

            // Use new endpoint that saves tokens
            const tokenEndpoint = import.meta.env.DEV 
                ? '/api/twitter-token-v2' 
                : '/api/twitter-token-v2';
            
            const authHeaders = await apiService.getAuthHeaders();
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
            }

            const data: TokenResponse = await response.json();
            
            // Clear session storage
            TwitterStorageService.clearTwitterSessionCredentials();
            
            // Update connection status
            this.isConnected = true;
            
            return true;
        } catch (error) {
            console.error('Twitter callback error:', error);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await apiService.deleteTokens('twitter');
            this.isConnected = false;
        } catch (error) {
            console.error('Failed to disconnect Twitter:', error);
            throw error;
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
        // Generate a random state token for CSRF protection
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}

// Hook to use TwitterService with Auth0 user context
export function useTwitterService() {
    const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
    const service = new TwitterServiceV2();
    
    if (user?.sub) {
        service.setUserId(user.sub);
    }
    
    // Ensure apiService has access to Auth0 token
    if (isAuthenticated) {
        apiService.setAuthTokenGetter(async () => {
            try {
                return await getAccessTokenSilently();
            } catch (error) {
                console.error('Failed to get access token:', error);
                return null;
            }
        });
    }
    
    return service;
}