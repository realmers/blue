import { env } from '@/env';
import pino from 'pino';

// Use a singleton pattern to avoid re-creating loggers (especially in HMR/Dev)
const globalForLogger = globalThis as unknown as { logger: pino.Logger };

export const logger =
  globalForLogger.logger ||
  pino({
    // Set level from env
    level: env.LOG_LEVEL, 
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname', // Cleaner dev output
              translateTime: 'SYS:standard',
            },
          }
        : undefined, // Use default JSON format in production
    // Best Practice: Redact sensitive data
    redact: {
      paths: ['password', 'token', 'headers.authorization', 'dbUrl'],
      remove: true,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForLogger.logger = logger;