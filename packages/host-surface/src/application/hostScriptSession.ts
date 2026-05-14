import {
  createAllowlist,
  type CapabilityId,
  InMemoryCapabilityRegistry,
} from '@luarizer/runtime-capabilities';
import {
  createSandboxScript,
  type Sandbox,
  type SandboxId,
  type SandboxRuntime,
  type TimeoutPolicy,
} from '@luarizer/runtime-core';

import { augmentHostWithCapabilityRegistry } from '../domain/capabilityRegistrySymbol.js';
import { buildBridgeMergeEnvForHost, type HostSurface } from './defineHostSurface.js';

export type HostScriptSessionOptions<THost> = {
  readonly runtime: SandboxRuntime;
  readonly surface: HostSurface;
  readonly host: THost;
  readonly slotKey: SandboxId;
  readonly allowedCapabilities: readonly CapabilityId[];
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

/**
 * One slot + capability allowlist + surface bridges. Call {@link HostScriptSession.openSession} before run/call.
 */
export class HostScriptSession<THost> {
  private sandbox: Sandbox | undefined;

  private readonly registry: InMemoryCapabilityRegistry;

  constructor(private readonly opts: HostScriptSessionOptions<THost>) {
    this.registry = new InMemoryCapabilityRegistry(createAllowlist([...opts.allowedCapabilities]));
  }

  readonly openSession = async (): Promise<void> => {
    this.sandbox = await this.opts.runtime.createSandbox({ slotKey: this.opts.slotKey });
  };

  readonly getCapabilityRegistry = (): InMemoryCapabilityRegistry => this.registry;

  private requireSandbox(): Sandbox {
    if (this.sandbox === undefined) {
      throw new Error('HostScriptSession: openSession() was not called');
    }
    return this.sandbox;
  }

  private mergeEnv() {
    const host = augmentHostWithCapabilityRegistry(this.opts.host, this.registry);
    return buildBridgeMergeEnvForHost(host, String(this.opts.slotKey), this.opts.surface);
  }

  readonly runChunk = async (source: string) => {
    const sb = this.requireSandbox();
    return sb.run({
      script: createSandboxScript(source),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  /**
   * Invokes `_ENV[tableName][methodName](luaTable)` where `luaTable` is built from string/number/boolean fields only.
   */
  readonly call = async (tableName: string, methodName: string, payload: Record<string, unknown>) => {
    const sb = this.requireSandbox();
    const tbl = recordToLuaTableLiteral(payload);
    const src = [
      `local t = _ENV[${JSON.stringify(tableName)}]`,
      `local f = type(t) == "table" and t[${JSON.stringify(methodName)}] or nil`,
      `if type(f) == "function" then`,
      `  f(${tbl})`,
      `end`,
    ].join('\n');
    return sb.run({
      script: createSandboxScript(src),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  readonly dispose = async (): Promise<void> => {
    if (this.sandbox !== undefined) {
      await this.sandbox.dispose();
      this.sandbox = undefined;
    }
  };
}

function recordToLuaTableLiteral(o: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') {
      parts.push(`${k} = ${JSON.stringify(v)}`);
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      parts.push(`${k} = ${v}`);
    } else if (typeof v === 'boolean') {
      parts.push(`${k} = ${v ? 'true' : 'false'}`);
    } else {
      throw new Error(`HostScriptSession.call: unsupported value type for key ${k}`);
    }
  }
  return `{ ${parts.join(', ')} }`;
}
