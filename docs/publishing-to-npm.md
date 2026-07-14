# Publishing `ng-number-flow` to npm

A step-by-step plan for releasing the library to the public npm registry. The package is an
**ng-packagr** (Angular Package Format) library: the build emits a ready-to-publish package into
`packages/ng-number-flow/dist`, and **that `dist` folder is what gets published** — it contains
the generated `package.json` with the correct `exports`, `module`, and `typings` fields plus the
copied `README.md`.

> Status: **published** — <https://www.npmjs.com/package/ng-number-flow> (`0.2.0`, `latest`).
> Releases run via [`.github/workflows/publish.yml`](../.github/workflows/publish.yml) with
> provenance (see §7) on every `v*` tag push. Partial compilation mode is set and the FESM
> bundle + types ship correctly (verified with `npm publish --dry-run` and a smoke-test install).
> `0.2.0` ships the signals-API migration of `NumberFlowComponent` (internal refactor, public
> API unchanged); `0.1.0` was the initial release.

---

## 0. Prerequisites (one-time)

1. **npm account** with access to publish. Create one at <https://www.npmjs.com/signup> if needed.
2. **Verify the name is free / owned:**
   ```bash
   npm view ng-number-flow
   ```
   `404` means the name is available. Anything else means it's taken — pick a scoped name
   (`@phalla-doll/ng-number-flow`) and set `"name"` accordingly in
   `packages/ng-number-flow/package.json`.
3. **Enable 2FA** on the npm account (recommended; required for some publish flows).

---

## 1. Pre-publish checklist

- [ ] Working tree clean, on `main`, pushed.
- [ ] `packages/ng-number-flow/package.json` `version` is correct and **not already on npm**.
- [ ] `README.md` in the package is up to date (it's the npm landing page).
- [ ] `publishConfig.access` is `"public"` (already set — required for a first-time scoped or
      public package).
- [ ] Library type-checks and builds cleanly.

```bash
pnpm --filter ng-number-flow typecheck
pnpm --filter ng-number-flow build
```

---

## 2. Version

Follow semver. Bump the version in `packages/ng-number-flow/package.json` **before** building
(the version is baked into `dist/package.json`).

```bash
# from packages/ng-number-flow
npm version patch   # 0.2.0 -> 0.2.1   (bug fixes)
npm version minor   # 0.2.0 -> 0.3.0   (new features, backward compatible)
npm version major   # 0.2.0 -> 1.0.0   (breaking changes)
```

`npm version` also creates a git commit + tag by default. If you prefer to manage tags manually
(as done for `v0.1.0`), edit the version field by hand and tag separately.

For pre-releases use `0.1.0-beta.0` and publish under a dist-tag (see §5).

---

## 3. Build

```bash
pnpm --filter ng-number-flow build
```

Produces `packages/ng-number-flow/dist/` with `fesm2022/`, `.d.ts` types, `package.json`, and
`README.md`.

---

## 4. Verify the package contents (dry run)

Inspect exactly what will be published **before** publishing:

```bash
cd packages/ng-number-flow/dist
npm publish --dry-run
# or produce a tarball to open/inspect:
npm pack
```

Confirm the file list includes the FESM bundle, type definitions, `package.json`, and
`README.md` — and nothing extraneous (no source `.ts`, no test files).

---

## 5. Publish

```bash
npm login                      # if not already authenticated
cd packages/ng-number-flow/dist
npm publish --access public
```

- `--access public` is required the first time for a scoped name; harmless for an unscoped one.
- **Pre-releases:** `npm publish --tag next` (or `beta`) so `latest` keeps pointing at the stable
  release. Promote later with `npm dist-tag add ng-number-flow@0.2.0 latest`.

> ⚠️ Publishes are near-permanent. A version can't be re-published, and unpublish is restricted
> (72h window, with conditions). The `--dry-run` in §4 is the safety net.

---

## 6. Post-publish

1. **Verify it's live:**
   ```bash
   npm view ng-number-flow
   ```
2. **Smoke-test install** in a scratch project:
   ```bash
   npm i ng-number-flow number-flow
   ```
3. **Tag + GitHub release** to match the published version (if not already done via
   `npm version`):
   ```bash
   git tag -a vX.Y.Z -m "ng-number-flow vX.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."
   ```

---

## 7. Automating with GitHub Actions (implemented)

This is already set up in [`.github/workflows/publish.yml`](../.github/workflows/publish.yml): it
publishes on tag push (`v*`) with npm **provenance** (supply-chain attestation). To enable it, add
an npm **automation** access token as the `NPM_TOKEN` repository secret
(`gh secret set NPM_TOKEN`). After that, releasing is: bump version → tag → push. The reference
implementation:

```yaml
# .github/workflows/publish.yml
name: publish
on:
  push:
    tags: ['v*']
permissions:
  contents: read
  id-token: write        # required for provenance
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ng-number-flow build
      - run: npm publish --provenance --access public
        working-directory: packages/ng-number-flow/dist
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add an npm **automation** access token as the `NPM_TOKEN` repository secret. After this, releasing
is just: bump version → tag → push.

---

## Notes

- **Peer dependency:** consumers must have `@angular/core >=19`. It is intentionally *not* bundled.
- **Runtime dependency:** `number-flow` (and `tslib`) ship as dependencies and install
  automatically; `ng-package.json` lists `number-flow` under `allowedNonPeerDependencies`.
- **Why publish from `dist/`:** the source `package.json` lacks the `exports`/`module`/`typings`
  entry points — ng-packagr generates them into `dist/package.json` at build time. Publishing the
  repo root would ship an unusable package.
