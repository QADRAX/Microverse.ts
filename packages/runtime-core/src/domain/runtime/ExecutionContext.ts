import type { SandboxId } from '../sandbox/SandboxId';
import type { CancellationToken } from './CancellationToken';

export type ExecutionContext = {
  readonly sandboxId: SandboxId;
  readonly cancellation: CancellationToken;
};
