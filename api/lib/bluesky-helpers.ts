import type { BlueSkyCredentials } from '../../src/types/index.js';

const BLUESKY_API_BASE = 'https://bsky.social/xrpc';

/**
 * Takes BlueSky credentials and authenticates with the BlueSky API.
 * Returns the access JWT and DID if successful.
 * Throws an error if login fails.
 */
export async function loginToBlueSky(credentials: BlueSkyCredentials): Promise<{ accessJwt: string; did: string }> {
    const response = await fetch(`${BLUESKY_API_BASE}/com.atproto.server.createSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        throw new Error('BlueSky login failed. Check credentials.');
    }

    const data = await response.json();
    return { accessJwt: data.accessJwt, did: data.did };
}