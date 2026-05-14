import { executeScript } from '../../application/useCases/executeScript';
import type { LoggerPort } from '../../application/ports/LoggerPort';
import type { RuntimeAdapter } from '../../domain/runtime/RuntimeAdapter';
import type { RunScriptInput } from '../../domain/runtime/RunScriptInput';
import type { CreateSandboxOptions, Sandbox, SandboxRuntime } from '../../domain/runtime/SandboxRuntime';
import { neverCancelledToken } from '../../domain/runtime/CancellationToken';
import { createSandboxId, type SandboxId } from '../../domain/sandbox/SandboxId';

export type StubSandboxRuntimeDeps = {
  readonly adapter: RuntimeAdapter;
  readonly logger: LoggerPort;
};

export class StubSandboxRuntime implements SandboxRuntime {
  private readonly usedSlotKeys = new Set<string>();

  constructor(private readonly deps: StubSandboxRuntimeDeps) {}

  readonly createSandbox = async (options: CreateSandboxOptions): Promise<Sandbox> => {
    const id =
      options.slotKey !== undefined ? options.slotKey : createSandboxId(createRandomId());
    if (options.slotKey !== undefined) {
      const k = String(options.slotKey);
      if (this.usedSlotKeys.has(k)) {
        throw new Error(`duplicate slotKey: ${k}`);
      }
      this.usedSlotKeys.add(k);
    }
    return createStubSandbox({
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

function createStubSandbox(input: {
  readonly id: SandboxId;
  readonly deps: StubSandboxRuntimeDeps;
  readonly options: CreateSandboxOptions;
  readonly explicitSlotKey: boolean;
  readonly usedSlotKeys: Set<string>;
}): Sandbox {
  const ctx = { sandboxId: input.id, cancellation: neverCancelledToken };
  return {
    id: input.id,
    run: async (runInput) => {
      const inputMerged: RunScriptInput =
        runInput.timeout !== undefined || input.options.defaultTimeout !== undefined
          ? { ...runInput, timeout: runInput.timeout ?? input.options.defaultTimeout }
          : { ...runInput };
      return executeScript([input.deps.adapter, input.deps.logger], ctx, inputMerged);
    },
    dispose: async () => {
      await input.deps.adapter.disposeSandbox?.(input.id);
      if (input.explicitSlotKey) {
        input.usedSlotKeys.delete(String(input.id));
      }
    },
  };
}

export function createStubSandboxRuntime(deps: StubSandboxRuntimeDeps): SandboxRuntime {
  return new StubSandboxRuntime(deps);
}
