// src/lib/auth.ts

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

// This is the core server-side instance of Better Auth.
export const auth = betterAuth({
    database: new Database("./sqlite.db"),
    baseURL: "http://localhost:3000",
    // Enable the email and password authenticator
    emailAndPassword: {
        enabled: true,
    },
});
