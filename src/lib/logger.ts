/**
 * @fileOverview Central logger module.
 * Wraps console methods with environment-aware behavior.
 * In development: logs with a prefix. In production: suppresses info logs.
 */

const PREFIX = '[AK]';
const isDev = process.env.NODE_ENV === 'development';

export function info(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.log(`${PREFIX} INFO`, message, ...args);
  }
}

export function warn(message: string, ...args: unknown[]): void {
  console.warn(`${PREFIX} WARN`, message, ...args);
}

export function error(message: string, ...args: unknown[]): void {
  console.error(`${PREFIX} ERROR`, message, ...args);
}
