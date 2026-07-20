export const DEFAULT_PUBLIC_LOAD_TIMEOUT_MS = 12_000;

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
