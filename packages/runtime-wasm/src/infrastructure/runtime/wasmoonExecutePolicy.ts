import type { CancellationToken, TimeoutPolicy } from '@luarizer/runtime-core';

export const LUARIZER_DEFAULT_MAX_SCRIPT_CHARS = 512_000;

type SchedulerHost = {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};

type TimerHandle = unknown;

const schedulerHost = (): SchedulerHost => globalThis as unknown as SchedulerHost;

const scheduleTimeout = (fn: () => void, ms: number): TimerHandle => {
  const host = schedulerHost();
  if (typeof host.setTimeout !== 'function') {
    throw new Error('luarizer: setTimeout is not available in this runtime');
  }
  return host.setTimeout(fn, ms);
};

const cancelTimeout = (handle: TimerHandle): void => {
  const host = schedulerHost();
  if (typeof host.clearTimeout === 'function') {
    host.clearTimeout(handle);
  }
};

class LuarizerTimeoutError extends Error {
  constructor() {
    super('luarizer: execution timed out');
    this.name = 'LuarizerTimeoutError';
  }
}

export function resolveTimeoutMs(timeout: TimeoutPolicy | undefined): number | undefined {
  if (timeout === undefined || timeout.kind === 'none') {
    return undefined;
  }
  return timeout.milliseconds;
}

export function assertScriptSize(script: string, maxChars: number): void {
  if (script.length > maxChars) {
    throw new Error(`luarizer: script exceeds max size (${script.length} > ${maxChars})`);
  }
}

export function assertNotCancelled(cancellation: CancellationToken): void {
  if (cancellation.isCancelled()) {
    throw new Error('luarizer: execution cancelled');
  }
}

/**
 * Runs an async Lua invocation with optional wall-clock timeout.
 * Note: synchronous infinite Lua still blocks the thread until the instruction hook fires;
 * callers should combine with {@link LUARIZER_DEFAULT_INSTRUCTION_BUDGET} in the bootstrap.
 */
export async function runWithWallClockTimeout(
  run: () => Promise<void>,
  timeoutMs: number | undefined,
): Promise<'ok' | 'timeout'> {
  if (timeoutMs === undefined) {
    await run();
    return 'ok';
  }
  let timer: TimerHandle | undefined;
  try {
    await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        timer = scheduleTimeout(() => reject(new LuarizerTimeoutError()), timeoutMs);
      }),
    ]);
    return 'ok';
  } catch (e) {
    if (e instanceof LuarizerTimeoutError) {
      return 'timeout';
    }
    throw e;
  } finally {
    if (timer !== undefined) {
      cancelTimeout(timer);
    }
  }
}

export function mapExecuteError(e: unknown): { readonly _tag: 'Timeout' } | { readonly _tag: 'Cancelled' } | { readonly _tag: 'AdapterError'; readonly message: string } {
  if (e instanceof LuarizerTimeoutError) {
    return { _tag: 'Timeout' };
  }
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes('execution cancelled')) {
    return { _tag: 'Cancelled' };
  }
  if (message.includes('instruction limit exceeded') || message.includes('script exceeds max size')) {
    return { _tag: 'AdapterError', message };
  }
  return { _tag: 'AdapterError', message };
}
