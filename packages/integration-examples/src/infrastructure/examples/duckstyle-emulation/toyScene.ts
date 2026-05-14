import type { ToyEntityId } from './types';

/** Referencia de script en una entidad (similar a `ScriptReference` en Duck, sin schema ECS). */
export type ToyScriptRef = {
  readonly scriptId: string;
  readonly source: string;
  readonly enabled: boolean;
};

export type ToyEntity = {
  readonly id: ToyEntityId;
  readonly scripts: readonly ToyScriptRef[];
};

/** “SceneState.entities” mínimo: mapa entidad → entidad. */
export type ToyScene = ReadonlyMap<ToyEntityId, ToyEntity>;

export function createToyScene(entities: readonly ToyEntity[]): ToyScene {
  return new Map(entities.map((e) => [e.id, e] as const));
}
