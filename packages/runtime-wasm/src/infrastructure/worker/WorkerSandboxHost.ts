import type {
  WorkerHostToRuntimeMessage,
  WorkerRuntimeToHostMessage,
} from '../../domain/worker/WorkerSandboxMessages';

export class WorkerSandboxHost {
  private last: WorkerRuntimeToHostMessage | null = null;

  readonly post = (message: WorkerHostToRuntimeMessage): void => {
    void message;
    this.last = { _tag: 'ready' };
  };

  readonly drain = (): WorkerRuntimeToHostMessage | undefined => {
    const v = this.last;
    this.last = null;
    return v === null ? undefined : v;
  };
}
