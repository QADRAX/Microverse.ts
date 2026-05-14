import type { SandboxScript } from '../sandbox/SandboxScript';
import type { TimeoutPolicy } from './TimeoutPolicy';

export type RunScriptInput = {
  readonly script: SandboxScript;
  readonly timeout?: TimeoutPolicy | undefined;
};
