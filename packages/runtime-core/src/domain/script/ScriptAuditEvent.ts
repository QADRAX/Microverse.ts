import type { ScriptInstanceContext } from './ScriptInstanceContext';

export type ScriptAuditEvent =
  | {
      readonly kind: 'mounted';
      readonly context: ScriptInstanceContext;
    }
  | {
      readonly kind: 'unmounted';
      readonly context: ScriptInstanceContext;
    }
  | {
      readonly kind: 'propsPatched';
      readonly context: ScriptInstanceContext;
      readonly changedKeys: readonly string[];
    }
  | {
      readonly kind: 'propsFlushed';
      readonly context: ScriptInstanceContext;
      readonly dirtyKeys: readonly string[];
    }
  | {
      readonly kind: 'hookInvoked';
      readonly context: ScriptInstanceContext;
      readonly hookName: string;
    }
  | {
      readonly kind: 'scriptError';
      readonly context: ScriptInstanceContext;
      readonly phase: string;
      readonly message: string;
    };
