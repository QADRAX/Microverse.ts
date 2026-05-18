import type { MicroverseId } from '../microverse/MicroverseId';
import type { CancellationToken } from './CancellationToken';

export type ExecutionContext = {
  readonly microverseId: MicroverseId;
  readonly cancellation: CancellationToken;
};
