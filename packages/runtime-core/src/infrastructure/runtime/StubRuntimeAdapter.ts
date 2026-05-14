import { ok, type Result } from '@luarizer/shared';

import type { RuntimeAdapter } from '../../domain/runtime/RuntimeAdapter';
import type { ExecutionContext } from '../../domain/runtime/ExecutionContext';
import type { ExecutionFailure } from '../../domain/runtime/ExecutionFailure';
import type { RunScriptResult } from '../../domain/runtime/RunScriptResult';
import type { SandboxScript } from '../../domain/sandbox/SandboxScript';

export class StubRuntimeAdapter implements RuntimeAdapter {
  readonly execute = async (
    _ctx: ExecutionContext,
    script: SandboxScript,
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
    return ok({ output: `stub:${String(script)}` });
  };
}
