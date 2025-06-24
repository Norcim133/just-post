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
  console.warn('AUTH0_DOMAIN environment variable is not set');
}

// Lazy load jose to avoid ES module issues
let joseModule: any = null;

async function getJose() {
  if (!joseModule) {
    joseModule = await import('jose');
  }
  return joseModule;
}

export async function verifyAuth0Token(authHeader: string) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    const { jwtVerify, createRemoteJWKSet } = await getJose();
    
    // Create JWKS client
    const JWKS = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
    
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: AUTH0_AUDIENCE,
    });
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }
      
      // Verify the token
      const payload = await verifyAuth0Token(authHeader);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
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