import type { SurfaceSpecMethod } from './SurfaceSpecDocument';

export type SurfaceSpecBridgeInput = {
  readonly methods: Readonly<Record<string, SurfaceSpecMethod>>;
};
