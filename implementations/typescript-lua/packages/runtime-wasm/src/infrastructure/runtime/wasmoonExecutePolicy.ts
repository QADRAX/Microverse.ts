import type { CancellationToken, TimeoutPolicy } from '@microverse.ts/runtime-core';

export const MICROVERSE_LUA_DEFAULT_MAX_SCRIPT_CHARS = 512_000;

type SchedulerHost = {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};

type TimerHandle = unknown;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- globalThis lacks SchedulerHost in lib.dom
const schedulerHost = (): SchedulerHost => globalThis as unknown as SchedulerHost;

const scheduleTimeout = (fn: () => void, ms: number): TimerHandle => {
  const host = schedulerHost();
  if (typeof host.setTimeout !== 'function') {
    throw new Error('microverse: setTimeout is not available in this runtime');
  }
  return host.setTimeout(fn, ms);
};

const cancelTimeout = (handle: TimerHandle): void => {
  const host = schedulerHost();
  if (typeof host.clearTimeout === 'function') {
    host.clearTimeout(handle);
  }
};

class MicroverseTimeoutError extends Error {
  constructor() {
    super('microverse: execution timed out');
    this.name = 'MicroverseTimeoutError';
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
    throw new Error(`microverse: script exceeds max size (${script.length} > ${maxChars})`);
  }
}

export function assertNotCancelled(cancellation: CancellationToken): void {
  if (cancellation.isCancelled()) {
    throw new Error('microverse: execution cancelled');
  }
}

/**
 * Runs an async Lua invocation with optional wall-clock timeout.
 * Note: synchronous infinite Lua still blocks the thread until the instruction hook fires;
 * callers should combine with {@link MICROVERSE_LUA_DEFAULT_INSTRUCTION_BUDGET} in the bootstrap.
 */
export async function runWithWallClockTimeout(
  run: () => Promise<void>,
  timeoutMs: number | undefined,
): Promise<'ok' | 'timeout'> {
  if (timeoutMs === undefined) {
    await run();
    return 'ok';
  }
  // TimerHandle is intentionally opaque (`unknown`).
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- explicit optional slot
  let timer: TimerHandle | undefined;
  try {
    await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        timer = scheduleTimeout(() => reject(new MicroverseTimeoutError()), timeoutMs);
      }),
    ]);
    return 'ok';
  } catch (e) {
    if (e instanceof MicroverseTimeoutError) {
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
  if (e instanceof MicroverseTimeoutError) {
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
