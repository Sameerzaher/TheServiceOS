/**
 * Serialize Supabase writes so dependent rows (e.g. appointments → clients)
 * are not persisted out of order from parallel React effects.
 */
export function createWriteQueue(): {
  run<T>(fn: () => Promise<T>): Promise<T>;
} {
  let chain: Promise<void> = Promise.resolve();
  return {
    run<T>(fn: () => Promise<T>): Promise<T> {
      const result = chain.then(() => fn());
      chain = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}
