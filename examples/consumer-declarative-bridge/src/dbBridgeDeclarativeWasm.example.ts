import {
  buildDeclarativeBridgeTable,
  createSandboxId,
  createSandboxScript,
  Luarizer,
  type DeclarativeBridgeDeclaration,
} from '@luarizer/luarizer';

type DbHost = { readonly query: (sql: string) => string };

/**
 * End-to-end: declarative bridge table → `mergeEnv` on `sandbox.run` → Lua calls `Data.load`.
 */
export async function runDbBridgeDeclarativeWasmExample(): Promise<void> {
  const host: DbHost = {
    query: (sql) => (sql.includes('42') ? 'answer' : 'unknown'),
  };

  const declarations: readonly DeclarativeBridgeDeclaration<DbHost, string>[] = [
    {
      name: 'Data',
      perEntity: true,
      createApi: (h, slotKey) => ({
        load: (id: string) => h.query(`SELECT * FROM t WHERE slot=${slotKey} AND id=${id}`),
      }),
    },
  ];

  const runtime = Luarizer.createWasmRuntime();
  const slotKey = createSandboxId('tenant-1');
  const sandbox = await runtime.createSandbox({ slotKey });
  const bridges = buildDeclarativeBridgeTable(host, String(slotKey), declarations);

  const r = await sandbox.run({
    mergeEnv: bridges,
    script: createSandboxScript(`
      local row = Data.load("42")
      assert(row == "answer", "got: " .. tostring(row))
    `),
  });

  if (r._tag !== 'ok') {
    const msg =
      r._tag === 'err' && r.error._tag === 'AdapterError' ? r.error.message : JSON.stringify(r.error);
    throw new Error(`Lua run failed: ${msg}`);
  }

  await sandbox.dispose();
}
