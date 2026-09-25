export const DEFAULT_PUBLIC_LOAD_TIMEOUT_MS = 12_000;

export class PublicRequestTimeoutError extends Error {
  constructor() {
    super('La consulta publica demoro demasiado.');
    this.name = 'PublicRequestTimeoutError';
  }
}

export async function withPublicRequestTimeout<T>(
  task: Promise<T>,
  timeoutMs = DEFAULT_PUBLIC_LOAD_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new PublicRequestTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function waitForInitialPublicLoad(
  task: Promise<unknown>,
  timeoutMs = DEFAULT_PUBLIC_LOAD_TIMEOUT_MS,
): Promise<'settled' | 'timeout'> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task.then(
        () => 'settled' as const,
        () => 'settled' as const,
      ),
      new Promise<'timeout'>((resolve) => {
        timeoutId = setTimeout(() => resolve('timeout'), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
