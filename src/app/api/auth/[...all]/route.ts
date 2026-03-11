import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/better-auth";

/** Exposes the Better Auth GET and POST handlers for the auth route. */
export const { GET, POST } = toNextJsHandler(auth.handler);
