import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";

import { hash, verify } from "argon2";

import { env } from "@/env";
import { db } from "@/server/db";

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
    username()
  ],
  socialProviders: {
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

});

export type Session = typeof auth.$Infer.Session;
