import 'server-only';

import { createHash } from 'crypto';
import { headers } from 'next/headers';

type RateLimitInput = {
  scope: string;
  identity?: string;
  limit: number;
  windowMs: number;
};

type LocalRateLimit = {
  count: number;
  resetAt: number;
};

const localLimits = new Map<string, LocalRateLimit>();

function getClientAddress(): string {
  try {
    const requestHeaders = headers();
    return (
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
      || requestHeaders.get('x-real-ip')
      || 'unknown'
    );
  } catch {
    return 'unknown';
  }
}

function buildKey(scope: string, identity?: string): string {
  return createHash('sha256')
    .update(`${scope}|${getClientAddress()}|${identity || 'anonymous'}`)
    .digest('hex');
}

function enforceLocalLimit(key: string, input: RateLimitInput): void {
  const now = Date.now();
  const current = localLimits.get(key);
  if (!current || current.resetAt <= now) {
    localLimits.set(key, { count: 1, resetAt: now + input.windowMs });
    return;
  }
  if (current.count >= input.limit) {
    throw new Error('Demasiados intentos. Espera unos minutos y vuelve a probar.');
  }
  current.count += 1;
  localLimits.set(key, current);
}

export async function enforcePublicRateLimit(input: RateLimitInput): Promise<void> {
  const key = buildKey(input.scope, input.identity);
  const now = Date.now();

  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (!dbAdmin) {
      enforceLocalLimit(key, input);
      return;
    }

    const ref = dbAdmin.collection('public_rate_limits').doc(key);
    await dbAdmin.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const current = snapshot.data() as LocalRateLimit | undefined;
      if (!current || current.resetAt <= now) {
        transaction.set(ref, {
          count: 1,
          resetAt: now + input.windowMs,
          scope: input.scope,
          updatedAt: new Date(now).toISOString(),
        });
        return;
      }
      if (current.count >= input.limit) {
        throw new Error('Demasiados intentos. Espera unos minutos y vuelve a probar.');
      }
      transaction.update(ref, {
        count: current.count + 1,
        updatedAt: new Date(now).toISOString(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Demasiados intentos')) throw error;
    enforceLocalLimit(key, input);
  }
}
