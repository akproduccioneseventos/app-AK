import 'server-only';

interface RequestBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RequestBucket>();

export interface BotShieldConfig {
  maxRequests: number;
  windowSeconds: number;
}

const DEFAULT_CONFIG: BotShieldConfig = {
  maxRequests: 30,
  windowSeconds: 60,
};

/**
 * Escudo antibot y limitador de velocidad en memoria para endpoints públicos.
 * Protege el simulador y los formularios de spam sin necesidad de captchas invasivos.
 */
export function checkBotShield(
  clientIdentifier: string,
  config?: Partial<BotShieldConfig>
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const windowMs = cfg.windowSeconds * 1000;

  let bucket = buckets.get(clientIdentifier);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(clientIdentifier, bucket);
    return {
      allowed: true,
      remaining: cfg.maxRequests - 1,
      resetInSeconds: cfg.windowSeconds,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, cfg.maxRequests - bucket.count);
  const resetInSeconds = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > cfg.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
}
