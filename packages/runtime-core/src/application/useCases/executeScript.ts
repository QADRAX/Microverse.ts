import type { AsyncUseCase } from '@microverse.ts/shared';
import { err, type Result } from '@microverse.ts/shared';

import type { LoggerPort } from '../ports/LoggerPort';
import type { RuntimeAdapterPort } from '../ports/RuntimeAdapterPort';
import type { ExecutionContext } from '../../domain/runtime/ExecutionContext';
import type { ExecutionFailure } from '../../domain/runtime/ExecutionFailure';
import type { RunScriptInput } from '../../domain/runtime/RunScriptInput';
import type { RunScriptResult } from '../../domain/runtime/RunScriptResult';

export type ExecuteScriptPorts = readonly [RuntimeAdapterPort, LoggerPort];

/**
 * Port tuple order: `[RuntimeAdapterPort, LoggerPort]`.
 */
export const executeScript: AsyncUseCase<
  ExecuteScriptPorts,
  readonly [ExecutionContext, RunScriptInput],
  Result<RunScriptResult, ExecutionFailure>
> = async (ports, ctx, input) => {
  const [adapter, logger] = ports;
  if (ctx.cancellation.isCancelled()) {
    return err({ _tag: 'Cancelled' });
  }
  logger.info('executeScript:start');
  const result = await adapter.execute(ctx, input);
  logger.info('executeScript:end');
  return result;
};
