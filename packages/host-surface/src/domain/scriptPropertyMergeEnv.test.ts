import { describe, expect, it } from 'vitest';

import { mergeEnvSinkToScriptPropertyBag } from './scriptPropertyMergeEnv';

describe('scriptPropertyMergeEnv', () => {
  it('converts mergeEnv sink to ScriptPropertyBag', () => {
    expect(
      mergeEnvSinkToScriptPropertyBag({
        n: 1,
        path: { x: 2 },
        tags: ['a'],
      }),
    ).toEqual({ n: 1, path: { x: 2 }, tags: ['a'] });
  });
});
