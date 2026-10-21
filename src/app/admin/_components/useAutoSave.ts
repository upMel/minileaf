"use client";

import { useRef, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

import { useT } from "@/context/LanguageContext";

export function errorText(prefix: string, e: unknown): string {
  return `${prefix} (${e instanceof Error ? e.message : String(e)})`;
}

/**
 * Save-as-you-go for admin editors. `save` shows a change at once (in the
 * query cache) and then writes it; `run` is for writes that need fresh data
 * afterwards (adding rows, uploads). Writes go out one after another, so a
 * slow request never overwrites a newer one. On failure the real data is
 * reloaded and `error` says what went wrong.
 */
export function useAutoSave<T>(key: QueryKey, alsoRefresh?: QueryKey) {
  const queryClient = useQueryClient();
  const failed = useT().admin.common.failed;
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function begin() {
    setPending((n) => n + 1);
    setSaved(false);
    setError(null);
  }

  function end() {
    setPending((n) => n - 1);
    if (alsoRefresh) void queryClient.invalidateQueries({ queryKey: alsoRefresh, exact: true });
  }

  function enqueue<R>(work: () => Promise<R>): Promise<R> {
    const job = queue.current.then(work);
    queue.current = job.catch(() => undefined);
    return job;
  }

  function save(local: (data: T) => T, remote: () => Promise<unknown>): Promise<void> {
    const current = queryClient.getQueryData<T>(key);
    if (current !== undefined) queryClient.setQueryData(key, local(current));
    begin();
    return enqueue(remote)
      .then(() => setSaved(true))
      .catch(async (e: unknown) => {
        setError(errorText(failed, e));
        await queryClient.invalidateQueries({ queryKey: key });
      })
      .finally(end);
  }

  async function run<R>(work: () => Promise<R>, describe?: (e: unknown) => string): Promise<R | undefined> {
    begin();
    try {
      const result = await enqueue(work);
      setSaved(true);
      return result;
    } catch (e) {
      setError(describe ? describe(e) : errorText(failed, e));
      return undefined;
    } finally {
      await queryClient.invalidateQueries({ queryKey: key });
      end();
    }
  }

  return { save, run, pending, saved, error, setError };
}
