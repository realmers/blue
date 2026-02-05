import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const createPrismaClient = () => {
  const client = new PrismaClient({
    adapter,
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "info", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });

  // @ts-ignore - Prisma event types can be tricky with custom clients
  client.$on("query", (e: any) => {
    if (env.LOG_LEVEL === "debug" || env.LOG_LEVEL === "trace") {
      logger.debug(
        { query: e.query, params: e.params, durationMs: e.duration },
        "Prisma Query"
      );
    }
  });

  // @ts-ignore
  client.$on("info", (e: any) => {
    logger.info(e.message);
  });

  // @ts-ignore
  client.$on("warn", (e: any) => {
    logger.warn(e.message);
  });

  // @ts-ignore
  client.$on("error", (e: any) => {
    logger.error(e.message);
  });

  return client;
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
