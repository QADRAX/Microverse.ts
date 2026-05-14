# Duck-style emulation (toy `core-v2` + `scripting-lua`)

Emulación **mínima** para mostrar cómo un motor con la **forma** de

- `createSceneSubsystem` + eventos/fases, y  
- sesión + mapa de slots + `runHookOnAllSlots`,

puede colgarse de **`@luarizer/luarizer`** sin importar `@duckengine/*`.

No es una implementación real de Duck. Para el mapa capa por capa frente a `scripting-lua`, lee en la raíz del repo `docs/duckstyle-emulation-vs-scripting-lua.md`.

## Archivos

| Archivo | Rol |
|---------|-----|
| `types.ts` | IDs de marca (`ToyEntityId`, …). |
| `toyScene.ts` | “ECS” de juguete: entidades con lista de scripts `{ scriptId, source }`. |
| `toySlotState.ts` | Clave `entityId::scriptId` y estado por slot. |
| `luarizerToyScriptSandbox.ts` | Adaptador tipo `ScriptSandbox` (subconjunto) sobre `Luarizer.createWasmRuntime()`. |
| `toyScriptingSession.ts` | Sesión: slots + adaptador. |
| `reconcileToyEntityScripts.ts` | Análogo reducido de `reconcileEntityScriptSlots` / `initScriptSlot`. |
| `runToyHookOnAllSlots.ts` | Análogo de `runHookOnAllSlots`. |
| `toyScriptingSubsystem.ts` | Fábrica `createToyScriptingStack` con forma parecida a `createScriptingSubsystem`. |
| `duckstyleEmulation.example.ts` | Escenario ejecutable para tests. |
