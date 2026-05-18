export type ScriptInstanceId = string & { readonly __brand: 'ScriptInstanceId' };

export function createScriptInstanceId(id: string): ScriptInstanceId {
  if (id.length === 0) {
    throw new Error('ScriptInstanceId must be non-empty');
  }
  return id as ScriptInstanceId;
}

export type ScriptAuditTags = Readonly<Record<string, string | number | boolean>>;

export type ScriptInstanceContext = {
  readonly instanceId: ScriptInstanceId;
  readonly scriptId: string;
  readonly slotKey: string;
  readonly audit: ScriptAuditTags;
};

export function createScriptInstanceContext(args: {
  readonly instanceId: string;
  readonly scriptId: string;
  readonly slotKey: string;
  readonly audit?: ScriptAuditTags | undefined;
}): ScriptInstanceContext {
  return {
    instanceId: createScriptInstanceId(args.instanceId),
    scriptId: args.scriptId,
    slotKey: args.slotKey,
    audit: args.audit ?? {},
  };
}
