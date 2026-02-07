import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, username } from "better-auth/plugins";

import { hash, verify } from "argon2";

import { env } from "@/env";
import { db } from "@/server/db";
import { logger } from "@/lib/logger";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "sqlite" or "mysql"
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      // override default scrypt with argon2
      hash: async (password) => {
        return await hash(password);
      },
      verify: async ({ password, hash: storedHash }) => {
        return await verify(storedHash, password);
      },
    },
  },
  plugins: [
    username(),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        // Restrict mails to only finnsinte.se
        const allowedDomains = ["finnsinte.se"];
        const emailDomain = email.split("@")[1];

        if (!allowedDomains.includes(emailDomain!)) {
          // This prevents the email from being sent and stops the login flow
          throw new APIError("FORBIDDEN", {
            message: "Åtkomst begränsad till endast organisationens e-postadresser."
          });
        }
        console.log(`\n magic link,${email}, URL: ${url}`);
        // TODO implement email sending
      },
    }),
  ],
  socialProviders: {
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          logger.info(
            { userId: session.userId, sessionId: session.id },
            "User logged in"
          );
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  cookies: {
    secure: env.NODE_ENV === "production",
  },
  advanced: {
    database: {
      generateId: "serial" // use serial ids for users due to legacy database
    }
  },
  logger: {
    disabled: false,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      if (level === "info") {
        logger.info({ args }, message);
      } else if (level === "warn") {
        logger.warn({ args }, message);
      } else if (level === "error") {
        logger.error({ args }, message);
      } else {
        logger.debug({ args }, message);
      }
    }
  }

});

export type Session = typeof auth.$Infer.Session;
