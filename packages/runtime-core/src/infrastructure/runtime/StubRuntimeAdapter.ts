import { ok, type Result } from '@luarizer/shared';

import type { RuntimeAdapter } from '../../domain/runtime/RuntimeAdapter';
import type { ExecutionContext } from '../../domain/runtime/ExecutionContext';
import type { ExecutionFailure } from '../../domain/runtime/ExecutionFailure';
import type { RunScriptResult } from '../../domain/runtime/RunScriptResult';
import type { RunScriptInput } from '../../domain/runtime/RunScriptInput';

export class StubRuntimeAdapter implements RuntimeAdapter {
  readonly execute = async (
    _ctx: ExecutionContext,
    input: RunScriptInput,
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
    return ok({ output: `stub:${String(input.script)}` });
  };
}
