/**
 * @fileOverview Central logger wrapper for AK Producciones.
 * All output is prefixed with [AK] for easy filtering.
 * - info(): always on server (Firebase Cloud Functions logs), dev-only on client
 * - warn(), error(): always
 */

const PREFIX = '[AK]';

export function isBuildTime(): boolean {
  return process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';
}

export function shouldSkipFirestoreDuringBuild(): boolean {
  return isBuildTime() && process.env.AK_ALLOW_FIRESTORE_DURING_BUILD !== 'true';
}

export function isDefaultCredentialError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : String(value ?? '');
  return message.includes('Could not load the default credentials');
}

export function compactError(value: unknown): unknown {
  if (!(value instanceof Error)) return value;
  return {
    name: value.name,
    message: value.message,
  };
}

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
