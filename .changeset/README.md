# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) to version and publish the `@microverse/*` packages that ship with `@microverse/microverse-lua`.

When you change publishable packages, run:

```bash
pnpm changeset
```

Commit the generated file under `.changeset/`. After merge to `main`, the release workflow opens a **Version Packages** PR; merging that PR publishes to npm.
