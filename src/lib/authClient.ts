import { createAuthClient } from "better-auth/react";

// This client will be used by our React components.
export const authClient = createAuthClient({
    // We don't need to specify a baseURL because our API routes (`/api/auth/*`)
    // are on the same domain as our frontend.
});