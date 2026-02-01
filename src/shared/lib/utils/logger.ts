/**
 * Structured logging utility
 * Provides consistent logging interface across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error };
    console.error(this.formatMessage('error', message, errorContext));
  }

  // API-specific logging
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${endpoint}`, context);
  }

  apiResponse(method: string, endpoint: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${endpoint} - ${status}`, context);
  }

  apiError(method: string, endpoint: string, error: Error | unknown, context?: LogContext): void {
    this.error(`API Error: ${method} ${endpoint}`, error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel, LogContext };
