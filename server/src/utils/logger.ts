export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel(): LogLevel {
  return (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
}

function log(level: LogLevel, message: string, meta?: unknown) {
  if (levels[level] < levels[currentLevel()]) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta instanceof Error) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, meta.message);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(meta.stack);
    }
    return;
  }
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, meta);
    return;
  }
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
}

export const logger = {
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
};
