/** Infers {@link HostSurfaceMethodEntry.async} from handler shape unless overridden explicitly. */
export function inferMethodAsync(def: {
  readonly handler: { constructor: { readonly name: string } };
  readonly async?: boolean | undefined;
}): boolean {
  if (def.async === true) {
    return true;
  }
  if (def.async === false) {
    return false;
  }
  return def.handler.constructor.name === 'AsyncFunction';
}
