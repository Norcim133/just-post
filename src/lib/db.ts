import { kv } from '@vercel/kv';
import { sealData, unsealData } from 'iron-session';

export interface PlaintextCredentials {
    identifier: string;
    password: string;
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