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
  constructor(private readonly deps: StubSandboxRuntimeDeps) {}

  readonly createSandbox = async (options: CreateSandboxOptions): Promise<Sandbox> => {
    const id = createSandboxId(createRandomId());
    return createStubSandbox({ id, deps: this.deps, options });
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
}): Sandbox {
  const ctx = { sandboxId: input.id, cancellation: neverCancelledToken };
  return {
    id: input.id,
    run: async (runInput) => {
      const inputMerged: RunScriptInput =
        runInput.timeout !== undefined || input.options.defaultTimeout !== undefined
          ? {
              script: runInput.script,
              timeout: runInput.timeout ?? input.options.defaultTimeout,
            }
          : { script: runInput.script };
      return executeScript([input.deps.adapter, input.deps.logger], ctx, inputMerged);
    },
    dispose: async () => {},
  };
}

export function createStubSandboxRuntime(deps: StubSandboxRuntimeDeps): SandboxRuntime {
  return new StubSandboxRuntime(deps);
}
