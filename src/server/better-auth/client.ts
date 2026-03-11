import { createAuthClient } from "better-auth/react";
import { magicLinkClient, usernameClient } from "better-auth/client/plugins";

/** Client-side Better Auth instance for sign-in and session operations. */
export const authClient = createAuthClient({
    plugins:
    [
        usernameClient(),   
        magicLinkClient()
    ]
});

export type Session = typeof authClient.$Infer.Session;
