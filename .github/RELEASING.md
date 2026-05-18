# Releasing `@microverse.ts/*` to npm

## One-time setup

1. **npm organization** — Create the [`microverse.ts`](https://www.npmjs.com/org/create) organization on npmjs.com (scope **`@microverse.ts`**).

2. **GitHub secret (environment `PROD`)** — **Settings → Environments → PROD → Environment secrets**, add:
   - `NPM_TOKEN` — npm access token with **Publish** permission for the `@microverse.ts` scope (type **Automation** recommended).

   The **Release** workflow sets `environment: PROD`, so the token is only available when that job runs (optionally with required reviewers on the environment).

3. **Allow Actions to open PRs** — **Settings → Actions → General → Workflow permissions**:
   - Select **Read and write permissions**
   - Enable **Allow GitHub Actions to create and approve pull requests**

   Without this, `changesets/action` can still run `changeset version` and push `changeset-release/main`, but fails with: `GitHub Actions is not permitted to create or approve pull requests`.

4. **Branch protection (recommended)** — Require the **CI** workflow to pass on pull requests targeting `main`.

## Day-to-day flow

1. Make changes under `implementations/typescript-lua/packages/` (publishable graph).
2. From `implementations/typescript-lua/`, run `pnpm changeset` and commit the generated `.changeset/*.md` file in your PR.
3. Merge to `main`.
4. The **Release** workflow either:
   - opens a **Version Packages** PR (bumps versions + changelog), or
   - publishes to npm when that version PR is merged and there are no pending changesets.

## Verify a release

```bash
mkdir /tmp/microverse-smoke && cd /tmp/microverse-smoke
pnpm init
pnpm add @microverse.ts/microverse-lua @microverse.ts/surface-spec zod
```

Run a minimal script from [`packages/microverse-lua/README.md`](../implementations/typescript-lua/packages/microverse-lua/README.md).

## Troubleshooting

| Issue                  | Fix                                                                  |
| ---------------------- | -------------------------------------------------------------------- |
| `ENEEDAUTH` on publish | Check `NPM_TOKEN` secret and token publish rights for `@microverse.ts`. |
| 404 scope not found    | Create the npm org `microverse.ts` before the first publish.         |
| Version PR not created | Ensure `.changeset/*.md` files were merged to `main`.                |
| `not permitted to create or approve pull requests` | Enable workflow write + “Allow GitHub Actions to create and approve pull requests” (step 3). Or open a PR manually from `changeset-release/main` → `main`. |
