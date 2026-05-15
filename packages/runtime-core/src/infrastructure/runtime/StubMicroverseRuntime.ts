import { executeScript } from '../../application/useCases/executeScript';
import type { LoggerPort } from '../../application/ports/LoggerPort';
import type { RuntimeAdapter } from '../../domain/runtime/RuntimeAdapter';
import type { RunScriptInput } from '../../domain/runtime/RunScriptInput';
import type { CreateMicroverseOptions, MicroverseSlot, MicroverseRuntime } from '../../domain/runtime/MicroverseRuntime';
import { neverCancelledToken } from '../../domain/runtime/CancellationToken';
import type { TimeoutPolicy } from '../../domain/runtime/TimeoutPolicy';
import { createMicroverseId, type MicroverseId } from '../../domain/microverse/MicroverseId';

export type StubMicroverseRuntimeDeps = {
  readonly adapter: RuntimeAdapter;
  readonly logger: LoggerPort;
  /** Applied when neither {@link RunScriptInput.timeout} nor {@link CreateMicroverseOptions.defaultTimeout} is set. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

export class StubMicroverseRuntime implements MicroverseRuntime {
  private readonly usedSlotKeys = new Set<string>();

  constructor(private readonly deps: StubMicroverseRuntimeDeps) {}

  readonly createMicroverse = async (options: CreateMicroverseOptions): Promise<MicroverseSlot> => {
    const id =
      options.slotKey !== undefined ? options.slotKey : createMicroverseId(createRandomId());
    if (options.slotKey !== undefined) {
      const k = String(options.slotKey);
      if (this.usedSlotKeys.has(k)) {
        throw new Error(`duplicate slotKey: ${k}`);
      }
      this.usedSlotKeys.add(k);
    }
    return createStubMicroverseSlot({
      id,
      deps: this.deps,
      options,
      explicitSlotKey: options.slotKey !== undefined,
      usedSlotKeys: this.usedSlotKeys,
    });
  };
}

function createRandomId(): string {
  const g = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string };
  };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  return `sandbox-${Math.random().toString(16).slice(2)}`;
}

function createStubMicroverseSlot(input: {
  readonly id: MicroverseId;
  readonly deps: StubMicroverseRuntimeDeps;
  readonly options: CreateMicroverseOptions;
  readonly explicitSlotKey: boolean;
  readonly usedSlotKeys: Set<string>;
}): MicroverseSlot {
  const ctx = { microverseId: input.id, cancellation: neverCancelledToken };
  return {
    id: input.id,
    run: async (runInput) => {
      const resolvedTimeout =
        runInput.timeout ?? input.options.defaultTimeout ?? input.deps.defaultTimeout;
      const inputMerged: RunScriptInput =
        resolvedTimeout !== undefined ? { ...runInput, timeout: resolvedTimeout } : { ...runInput };
      return executeScript([input.deps.adapter, input.deps.logger], ctx, inputMerged);
    },
    dispose: async () => {
      await input.deps.adapter.disposeMicroverse?.(input.id);
      if (input.explicitSlotKey) {
        input.usedSlotKeys.delete(String(input.id));
      }
    },
  };
}

export function createStubMicroverseRuntime(deps: StubMicroverseRuntimeDeps): MicroverseRuntime {
  return new StubMicroverseRuntime(deps);
}
