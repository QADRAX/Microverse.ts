import type { SandboxRuntime } from '../../domain/runtime/SandboxRuntime';
import type { SandboxInstanceId } from '../../domain/runtime/SandboxInstanceId';

/**
 * Keeps many {@link SandboxRuntime} instances keyed by {@link SandboxInstanceId}.
 * Each entry is typically its own `SandboxRuntime` (hence its own Wasmoon/Lua VM when using `@luarizer/runtime-wasm`).
 *
 * This type does **not** dispose Lua engines: call `Sandbox.dispose()` on every
 * created sandbox before `unregister`, and dispose any other host resources yourself.
 */
export class IsolatedSandboxRuntimeMap {
  private readonly runtimes = new Map<SandboxInstanceId, SandboxRuntime>();

  readonly register = (id: SandboxInstanceId, runtime: SandboxRuntime): void => {
    if (this.runtimes.has(id)) {
      throw new Error(`duplicate sandbox instance id: ${String(id)}`);
    }
    this.runtimes.set(id, runtime);
  };

  readonly unregister = (id: SandboxInstanceId): void => {
    this.runtimes.delete(id);
  };

  readonly get = (id: SandboxInstanceId): SandboxRuntime | undefined => this.runtimes.get(id);

  readonly has = (id: SandboxInstanceId): boolean => this.runtimes.has(id);

  readonly ids = (): IterableIterator<SandboxInstanceId> => this.runtimes.keys();

  readonly clear = (): void => {
    this.runtimes.clear();
  };
}
