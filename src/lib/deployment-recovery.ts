'use client';

const RECOVERY_KEY = 'ak_deployment_recovery_at';
const RECOVERY_COOLDOWN_MS = 60_000;

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.cause ? errorText(error.cause) : ''}`;
  }
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return [record.name, record.message, record.digest, record.cause]
      .map(errorText)
      .join(' ');
  }
  return String(error ?? '');
}

export function isDeploymentMismatchError(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  return (
    message.includes('failed to find server action') ||
    message.includes('older or newer deployment') ||
    message.includes('chunkloaderror') ||
    (message.includes('loading chunk') && message.includes('failed'))
  );
}

async function clearStaleAppCaches() {
  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || '';
          return scriptUrl.endsWith('/sw.js');
        })
        .map((registration) => registration.unregister())
    );
  }
}

export async function recoverFromDeploymentMismatch(error: unknown): Promise<boolean> {
  if (typeof window === 'undefined' || !isDeploymentMismatchError(error)) return false;

  const lastRecovery = Number(window.sessionStorage.getItem(RECOVERY_KEY) || 0);
  if (Date.now() - lastRecovery < RECOVERY_COOLDOWN_MS) return false;

  window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  await clearStaleAppCaches().catch(() => undefined);
  window.location.reload();
  return true;
}
