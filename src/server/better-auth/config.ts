import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, username } from "better-auth/plugins";
import { z } from "zod";

import { hash, verify } from "argon2";

import { env } from "@/env";
import { db } from "@/server/db";
import { logger } from "@/lib/logger";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "sqlite" or "mysql"
  }),
  user: {
    additionalFields: {
      role_id: {
        type: "number",
        input: false, // Don't allow user to set this
      },
    },
  },
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

        const emailSchema = z.email().refine((e) => {
          const domain = e.split("@")[1]?.toLowerCase();
          return domain && allowedDomains.includes(domain);
        }, {
          message: "Åtkomst begränsad till endast organisationens e-postadresser."
        });

        const result = emailSchema.safeParse(email);

        if (!result.success) {
          throw new APIError("FORBIDDEN", {
            message: result.error?.message ?? "Ogiltig e-postadress."
          });
        }

        logger.info({ email: result.data, url }, "Magic link link generated");
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
