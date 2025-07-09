import { kv } from '@vercel/kv';
import { sealData, unsealData } from 'iron-session';

const encryptionPassword = process.env.CREDENTIALS_SECRET;

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

/**
 * Securely encrypts and stores a value in Vercel KV with an expiration.
 * The key is automatically constructed from the prefix and userId.
 *
 * @param prefix - A string to identify the data type (e.g., 'bluesky_credentials', 'twitter_tokens').
 * @param userId - The ID of the user.
 * @param value - The plaintext object to store.
 * @param ttlInSeconds - time until record expires
 * @returns True if successful, false on error.
 */
export async function setValueEx<T>(prefix: string, userId: string, value: T, ttlInSeconds: number): Promise<boolean> {
    if (!encryptionPassword || encryptionPassword.length < 32) {
        throw new Error('CREDENTIALS_SECRET environment variable must be set and be at least 32 characters long.');
    }
    
    try {
        const encryptedData = await sealData(value, {
            password: encryptionPassword,
        });

        const key = `${prefix}:${userId}`;
        await kv.setex(key, ttlInSeconds, encryptedData);
        return true;
    } catch (error: any) {
        console.error(`Issue storing value for key [${prefix}:${userId}]:`, error);
        return false;
    }
}

/**
 * Deletes a key from Vercel KV.
 * @returns True if successful, false on error.
 */
export async function deleteValue(prefix: string, userId: string): Promise<boolean> {
    try {
        const key = `${prefix}:${userId}`;
        await kv.del(key);
        return true;
    } catch (error: any) {
        console.error(`Issue deleting value for key [${prefix}:${userId}]:`, error);
        return false;
    }
}