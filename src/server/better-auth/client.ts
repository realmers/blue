import { createAuthClient } from "better-auth/react";
import { magicLinkClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins:
    [
        usernameClient(),   
        magicLinkClient()
    ]
});

export type Session = typeof authClient.$Infer.Session;
