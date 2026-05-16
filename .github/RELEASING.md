# Releasing `@microverse/*` to npm

## One-time setup

1. **npm organization** — Create the [`@microverse`](https://www.npmjs.com/org/create) scope on npmjs.com (or ensure your account can publish scoped public packages).

2. **GitHub secret (environment `PROD`)** — **Settings → Environments → PROD → Environment secrets**, add:
   - `NPM_TOKEN` — npm access token with **Publish** permission for the `@microverse` scope (type **Automation** recommended).

   The **Release** workflow sets `environment: PROD`, so the token is only available when that job runs (optionally with required reviewers on the environment).

3. **Branch protection (recommended)** — Require the **CI** workflow to pass on pull requests targeting `main`.

## Day-to-day flow

1. Make changes under `packages/` (publishable graph).
2. Run `pnpm changeset` and commit the generated `.changeset/*.md` file in your PR.
3. Merge to `main`.
4. The **Release** workflow either:
   - opens a **Version Packages** PR (bumps versions + changelog), or
   - publishes to npm when that version PR is merged and there are no pending changesets.

## Verify a release

```bash
mkdir /tmp/microverse-smoke && cd /tmp/microverse-smoke
pnpm init
pnpm add @microverse/microverse-lua zod
```

Run a minimal script from [`packages/microverse-lua/README.md`](../packages/microverse-lua/README.md).

## Troubleshooting

| Issue                  | Fix                                                                  |
| ---------------------- | -------------------------------------------------------------------- |
| `ENEEDAUTH` on publish | Check `NPM_TOKEN` secret and token publish rights for `@microverse`. |
| 404 scope not found    | Create the npm org/scope before the first publish.                   |
| Version PR not created | Ensure `.changeset/*.md` files were merged to `main`.                |
