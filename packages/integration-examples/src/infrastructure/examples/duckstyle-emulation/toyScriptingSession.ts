import { LuarizerToyScriptSandboxAdapter } from './luarizerToyScriptSandbox';
import type { ToySlotState } from './toySlotState';

export type ToyScriptingSession = {
  readonly slots: Map<string, ToySlotState>;
  readonly sandbox: LuarizerToyScriptSandboxAdapter;
};

export function createToyScriptingSession(): ToyScriptingSession {
  return {
    slots: new Map(),
    sandbox: new LuarizerToyScriptSandboxAdapter(),
  };
}
