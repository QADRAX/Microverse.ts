export type WorkerHostToRuntimeMessage =
  | { readonly _tag: 'init'; readonly wasmEntrypoint: string }
  | { readonly _tag: 'execute'; readonly requestId: string; readonly script: string };

export type WorkerRuntimeToHostMessage =
  | { readonly _tag: 'ready' }
  | { readonly _tag: 'result'; readonly requestId: string; readonly output: string }
  | { readonly _tag: 'error'; readonly requestId: string; readonly message: string };
