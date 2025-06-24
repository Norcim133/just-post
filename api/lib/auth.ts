import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    sub: string; // Auth0 user ID
    email?: string;
    name?: string;
  };
}

const AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.VITE_AUTH0_AUDIENCE || `https://${AUTH0_DOMAIN}/api/v2/`;

if (!AUTH0_DOMAIN) {
  throw new Error('AUTH0_DOMAIN environment variable is not set');
}

// Create JWKS client
const JWKS = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));

export async function verifyAuth0Token(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: AUTH0_AUDIENCE,
    });
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }
      
      // Extract the token
      const token = authHeader.substring(7);
      
      // Verify the token
      const payload = await verifyAuth0Token(token);
      
      // Add user info to request
      req.user = {
        sub: payload.sub as string,
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
      };
      
      // Call the handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}