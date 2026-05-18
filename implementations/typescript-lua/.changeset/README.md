# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) to version and publish `@microverse.ts/*`. The **fixed** group (same semver) includes `@microverse.ts/surface-spec`, `@microverse.ts/microverse-lua`, and runtime packages. `@microverse.ts/cli` versions independently.

When you change publishable packages, run:

```bash
pnpm changeset
```

Commit the generated file under `.changeset/`. After merge to `main`, the release workflow opens a **Version Packages** PR; merging that PR publishes to npm.
