import 'server-only';

import { createHash } from 'crypto';
import { headers } from 'next/headers';

type RateLimitInput = {
  scope: string;
  identity?: string;
  limit: number;
  windowMs: number;
  /**
   * Cuenta SIN la direccion de quien llama, para poner un techo compartido.
   *
   * Por defecto la cuenta es por direccion: eso frena a un robot solo. Pero para
   * lo que se paga por pedido —los chats de inteligencia artificial— tambien hace
   * falta un techo por fiesta, porque cien direcciones distintas pidiendo una vez
   * cada una gastan lo mismo que una pidiendo cien veces.
   *
   * Se usa junto con la cuenta por direccion, nunca en lugar de ella.
   */
  ignoreClientAddress?: boolean;
};

type LocalRateLimit = {
  count: number;
  resetAt: number;
};

const localLimits = new Map<string, LocalRateLimit>();

async function getClientAddress(): Promise<string> {
  try {
    const requestHeaders = await headers();
    return (
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
      || requestHeaders.get('x-real-ip')
      || 'unknown'
    );
  } catch {
    return 'unknown';
  }
}

async function buildKey(
  scope: string,
  identity?: string,
  ignoreClientAddress?: boolean,
): Promise<string> {
  const direccion = ignoreClientAddress ? 'todas' : await getClientAddress();
  return createHash('sha256')
    .update(`${scope}|${direccion}|${identity || 'anonymous'}`)
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
  const key = await buildKey(input.scope, input.identity, input.ignoreClientAddress);
  const now = Date.now();

  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
    enforceLocalLimit(key, input);
    return;
  }

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
