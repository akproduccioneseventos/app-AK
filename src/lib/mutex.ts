export class AsyncMutex {
  private mutex = Promise.resolve();

  async runExclusive<T>(callback: () => Promise<T> | T): Promise<T> {
    let resolve: () => void;
    const next = new Promise<void>((res) => {
      resolve = res;
    });

    const curr = this.mutex;
    this.mutex = curr.then(() => next);

    return curr.then(async () => {
      try {
        return await callback();
      } finally {
        resolve!();
      }
    });
  }
}
