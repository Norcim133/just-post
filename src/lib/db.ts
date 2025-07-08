import { kv } from '@vercel/kv';
import { sealData, unsealData } from 'iron-session';

export interface PlaintextCredentials {
    identifier: string;
    password: string;
}

export interface PlaintextTokens {
    accessToken: string;
    refreshToken: string;
}

const encryptionPassword = process.env.CREDENTIALS_SECRET;

export async function storeCredentials( platformId: string, userId: string, plaintextCreds: PlaintextCredentials): Promise<boolean> {
    try {
        if (!encryptionPassword || encryptionPassword.length < 32) {
            throw new Error('CREDENTIALS_SECRET environment variable must be set and be at least 32 characters long.');
        }

        const encryptedData = await sealData(plaintextCreds, {
            password: encryptionPassword,
        });

        const userKey = `${platformId}:${userId}`;
        await kv.set(userKey, encryptedData);
        return true
    } catch (error: any) {
         console.error('Issue storing credentials:', error);
         return false
    }

}

export async function getCredentials(platformId: string, userId:string): Promise<PlaintextCredentials | null> {
    try {

        if (!encryptionPassword || encryptionPassword.length < 32) {
            throw new Error('CREDENTIALS_SECRET environment variable must be set and be at least 32 characters long.');
        }
        
        const userKey = `${platformId}:${userId}`;
        const encryptedData = await kv.get<string>(userKey);

        if (!encryptedData) {
            return null;
        }

        // Use iron-session's unsealData to securely decrypt the string back into our object.
        // The second argument specifies the Time-To-Live for the data, we can set it to 0 to disable expiry check
        // since we are not using this for session management.
        const plaintextCreds = await unsealData<PlaintextCredentials>(encryptedData, {
            password: encryptionPassword,
            ttl: 0, 
        });

        return plaintextCreds;
    } catch (error: any) {
        console.error('Issue retrieving/decrypting credentials:', error);
        return null;
    }
}

export async function storeTokens( platformId: string, userId: string, plaintextTokens: PlaintextTokens): Promise<boolean> {
    try {
        if (!encryptionPassword || encryptionPassword.length < 32) {
            throw new Error('CREDENTIALS_SECRET environment variable must be set and be at least 32 characters long.');
        }

        const encryptedData = await sealData(plaintextTokens, {
            password: encryptionPassword,
        });
        
        const userKey = `${platformId}:${userId}:tokens`;
        await kv.set(userKey, encryptedData);
        return true
    } catch (error: any) {
         console.error('Issue storing credentials:', error);
         return false
    }

}

/**
 * Securely encrypts and stores a value in Vercel KV.
 * The key is automatically constructed from the prefix and userId.
 *
 * @param prefix - A string to identify the data type (e.g., 'bluesky_credentials', 'twitter_tokens').
 * @param userId - The ID of the user.
 * @param value - The plaintext object to store.
 * @returns True if successful, false on error.
 */
export async function setValue<T>(prefix: string, userId: string, value: T): Promise<boolean> {
    if (!encryptionPassword || encryptionPassword.length < 32) {
        throw new Error('CREDENTIALS_SECRET environment variable must be set and be at least 32 characters long.');
    }
    
    try {
        const encryptedData = await sealData(value, {
            password: encryptionPassword,
        });

        const key = `${prefix}:${userId}`;
        await kv.set(key, encryptedData);
        return true;
    } catch (error: any) {
        console.error(`Issue storing value for key [${prefix}:${userId}]:`, error);
        return false;
    }
}

/**
 * Retrieves and securely decrypts a value from Vercel KV.
 *
 * @param prefix - The prefix used to store the data.
 * @param userId - The ID of the user.
 * @returns The decrypted object if found, otherwise null.
 */
export async function getValue<T>(prefix: string, userId: string): Promise<T | null> {
    if (!encryptionPassword || encryptionPassword.length < 32) {
        throw new Error('CREDENTIALS_SECRET environment variable must be set and be at least 32 characters long.');
    }

    try {
        const key = `${prefix}:${userId}`;
        const encryptedData = await kv.get<string>(key);

        if (!encryptedData) {
            return null;
        }

        const value = await unsealData<T>(encryptedData, {
            password: encryptionPassword,
            ttl: 0,
        });

        return value;
    } catch (error: any) {
        console.error(`Issue retrieving/decrypting value for key [${prefix}:${userId}]:`, error);
        return null;
    }
}