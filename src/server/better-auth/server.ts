import { auth } from ".";
import { headers } from "next/headers";
import { cache } from "react";

/** Returns the current authenticated session for the active request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
