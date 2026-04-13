/**
 * @fileOverview Central logger wrapper for AK Producciones.
 * All output is prefixed with [AK] for easy filtering.
 * - info(): always on server (Firebase Cloud Functions logs), dev-only on client
 * - warn(), error(): always
 */

const PREFIX = '[AK]';

export function info(message: string, ...args: unknown[]): void {
  // Always log on server (for Firebase Cloud Functions logs), dev-only on client
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'development') {
    console.log(PREFIX, message, ...args);
  }
}

export function warn(message: string, ...args: unknown[]): void {
  console.warn(PREFIX, message, ...args);
}

export function error(message: string, ...args: unknown[]): void {
  console.error(PREFIX, message, ...args);
}
