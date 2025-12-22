// ===========================================
// Structured Logger Utility
// ===========================================
// Provides consistent logging across the application
// with structured format for easy parsing in production

import { config } from '../config';

// ===========================================
// TYPES
// ===========================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ===========================================
// CONFIGURATION
// ===========================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = config.env === 'production' ? 'info' : 'debug';

// ===========================================
// FORMATTING
// ===========================================

function formatLogEntry(entry: LogEntry): string {
  if (config.env === 'production') {
    // JSON format for production (easy to parse by log aggregators)
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const timestamp = entry.timestamp;
  const level = entry.level.toUpperCase().padEnd(5);
  const message = entry.message;

  let output = `[${timestamp}] ${level} ${message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack && config.env !== 'production') {
      output += `\n  Stack: ${entry.error.stack}`;
    }
  }

  return output;
}

// ===========================================
// CORE LOGGING FUNCTION
// ===========================================

function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  // Check if this level should be logged
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const formatted = formatLogEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

// ===========================================
// PUBLIC API
// ===========================================

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext, error?: Error) => log('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),

  // Convenience method for logging with a service prefix
  forService: (serviceName: string) => ({
    debug: (message: string, context?: LogContext) =>
      log('debug', `[${serviceName}] ${message}`, context),
    info: (message: string, context?: LogContext) =>
      log('info', `[${serviceName}] ${message}`, context),
    warn: (message: string, context?: LogContext, error?: Error) =>
      log('warn', `[${serviceName}] ${message}`, context, error),
    error: (message: string, context?: LogContext, error?: Error) =>
      log('error', `[${serviceName}] ${message}`, context, error),
  }),
};

export default logger;
