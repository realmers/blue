import { env } from '@/env';
import pino from 'pino';

// Use a singleton pattern to avoid re-creating loggers (especially in HMR/Dev)
const globalForLogger = globalThis as unknown as { logger: pino.Logger };

export const logger =
  globalForLogger.logger ||
  pino({
    // Set level from env
    // FIXME: in production this should be a env variable for if file logging should be enabled or not.
    level: env.LOG_LEVEL,
    transport: {
      targets: [
        {
          target: process.env.NODE_ENV === 'development' ? 'pino-pretty' : 'pino/file',
          options: process.env.NODE_ENV === 'development'
            ? {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'SYS:standard',
              }
            : { destination: 1 }, // Write to stdout in production
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
    // Best Practice: Redact sensitive data
    redact: {
      paths: ['password', 'token', 'headers.authorization', 'dbUrl'],
      remove: true,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForLogger.logger = logger;