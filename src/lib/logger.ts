import { env } from '@/env';
import pino from 'pino';

// Use a singleton pattern to avoid re-creating loggers (especially in HMR/Dev)
const globalForLogger = globalThis as unknown as { logger: pino.Logger };

const isDev = env.NODE_ENV === 'development';

export const logger =
  globalForLogger.logger ||
  pino({
    level: env.LOG_LEVEL,
    ...(isDev
      ? {
          transport: {
            targets: [
              {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  ignore: 'pid,hostname',
                  translateTime: 'SYS:standard',
                },
              },
              {
                target: 'pino/file',
                options: {
                  destination: './logs/app.log',
                  mkdir: true,
                },
              },
            ],
          },
        }
      : {}), // In production (Vercel), write directly to stdout — no transports needed
    // Best Practice: Redact sensitive data
    redact: {
      paths: ['password', 'token', 'headers.authorization', 'dbUrl'],
      remove: true,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForLogger.logger = logger;