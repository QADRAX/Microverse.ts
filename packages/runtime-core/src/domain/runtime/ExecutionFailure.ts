export type ExecutionFailure =
  | { readonly _tag: 'Timeout' }
  | { readonly _tag: 'Cancelled' }
  | { readonly _tag: 'AdapterError'; readonly message: string };
