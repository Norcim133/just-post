// src/lib/auth.ts

import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// This is the core server-side instance of Better Auth.
export const auth = betterAuth({
    database: pool,
    baseURL: "http://localhost:3000",
    // Enable the email and password authenticator
    emailAndPassword: {
        enabled: true,
    },
});
