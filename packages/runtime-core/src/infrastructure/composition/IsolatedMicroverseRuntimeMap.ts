import type { MicroverseRuntime } from '../../domain/runtime/MicroverseRuntime';
import type { MicroverseInstanceId } from '../../domain/runtime/MicroverseInstanceId';

/**
 * Keeps many {@link MicroverseRuntime} instances keyed by {@link MicroverseInstanceId}.
 * Each entry is typically its own `MicroverseRuntime` (hence its own Wasmoon/Lua VM when using `@microverse/runtime-wasm`).
 *
 * This type does **not** dispose Lua engines: call `MicroverseSlot.dispose()` on every
 * created sandbox before `unregister`, and dispose any other host resources yourself.
 */
export class IsolatedMicroverseRuntimeMap {
  private readonly runtimes = new Map<MicroverseInstanceId, MicroverseRuntime>();

  readonly register = (id: MicroverseInstanceId, runtime: MicroverseRuntime): void => {
    if (this.runtimes.has(id)) {
      throw new Error(`duplicate sandbox instance id: ${String(id)}`);
    }
    this.runtimes.set(id, runtime);
  };

  readonly unregister = (id: MicroverseInstanceId): void => {
    this.runtimes.delete(id);
  };

  readonly get = (id: MicroverseInstanceId): MicroverseRuntime | undefined => this.runtimes.get(id);

  readonly has = (id: MicroverseInstanceId): boolean => this.runtimes.has(id);

  readonly ids = (): IterableIterator<MicroverseInstanceId> => this.runtimes.keys();

  readonly clear = (): void => {
    this.runtimes.clear();
  };
}
