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

/**
 * Options for {@link HostScriptSession}: one Wasm (or other) slot, a surface, host services, and a capability allowlist.
 *
 * @typeParam THost - Your engine context; must be compatible with the `THost` used in {@link defineHostSurface} / {@link fn}.
 */
export type HostScriptSessionOptions<THost> = {
  /** Shared runtime (typically one Wasmoon VM for many slots). */
  readonly runtime: SandboxRuntime;
  /** Surface produced by {@link defineHostSurface}. */
  readonly surface: HostSurface;
  /** Host services passed into bridge handlers (orders, clock, …). */
  readonly host: THost;
  /** Stable sandbox id for this script / workflow / entity. */
  readonly slotKey: SandboxId;
  /** Exact capability ids this session may invoke on any bridge method. */
  readonly allowedCapabilities: readonly CapabilityId[];
  /** Optional default timeout forwarded to {@link Sandbox.run}. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

/**
 * Binds one **Lua slot** to a {@link HostSurface}: capability allowlist, Zod validation, and `mergeEnv` wiring.
 *
 * @remarks
 * Call {@link HostScriptSession.openSession} once before {@link HostScriptSession.runChunk} or {@link HostScriptSession.call}.
 * Dispose when the workflow or entity is torn down.
 *
 * @typeParam THost - Same host type as your surface handlers.
 */
export class HostScriptSession<THost> {
  private sandbox: Sandbox | undefined;

  private readonly registry: InMemoryCapabilityRegistry;

  constructor(private readonly opts: HostScriptSessionOptions<THost>) {
    this.registry = new InMemoryCapabilityRegistry(createAllowlist([...opts.allowedCapabilities]));
  }

  /**
   * Allocates the underlying {@link Sandbox} for this `slotKey` on the shared runtime.
   */
  readonly openSession = async (): Promise<void> => {
    this.sandbox = await this.opts.runtime.createSandbox({ slotKey: this.opts.slotKey });
  };

  /**
   * Exposes the in-memory registry (e.g. to mutate allowlists in advanced tests).
   */
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

  /**
   * Executes Lua source in the slot environment with surface bridges on `_ENV`.
   *
   * @param source - Full Lua chunk (compiled with `load(..., "t", env)` in the Wasm adapter).
   */
  readonly runChunk = async (source: string) => {
    const sb = this.requireSandbox();
    return sb.run({
      script: createSandboxScript(source),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  /**
   * Invokes `_ENV[tableName][methodName](literalTable)` where `literalTable` is built only from
   * string, finite number, or boolean fields in `payload`.
   *
   * @param tableName - Global table name in the slot env.
   * @param methodName - Function field on that table.
   * @param payload - Plain serializable fields for the Lua table literal.
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

  /**
   * Releases the slot in the runtime adapter and clears the session handle.
   */
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
