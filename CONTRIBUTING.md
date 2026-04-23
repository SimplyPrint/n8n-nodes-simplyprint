# Contributing

Local setup, test recipes, and release steps for `@simplyprint/n8n-nodes-simplyprint`.

## Prerequisites

- **Node.js** `>= 20.15` (see `engines.node` in `package.json`).
- **npm** (this package ships via `npm publish`; the pinned lockfile is npm-flavoured).
- A SimplyPrint test account and an OAuth2 credential or API key for running the node end-to-end.

## Local development

```bash
npm ci
npm run build          # tsc + copy icons + copy codex files to dist/
npm run lint           # eslint with plugin:n8n-nodes-base/{community,credentials,nodes}
npm run test           # vitest unit tests
npm run dev            # tsc --watch (run alongside an n8n dev instance)
```

### Load the node into a local n8n

1. `cd ~/.n8n/custom && npm link /path/to/this/repo` (or `npm link` globally, then `npm link @simplyprint/n8n-nodes-simplyprint` inside `~/.n8n/custom`).
2. Start n8n with `N8N_COMMUNITY_PACKAGES_ENABLED=true`.
3. After any change, run `npm run build` in this repo — n8n picks up the new `dist/` on its next hot reload / restart.

### Scan before submitting for verification

n8n recommends running the official scanner before submitting the package for verification. It runs the same lint suite the verifier uses plus a few package-structure checks:

```bash
npx @n8n/scan-community-package @simplyprint/n8n-nodes-simplyprint
```

## Code conventions

- **UI copy**: Title Case for node names, display names, and dropdown titles. Sentence case for action names, descriptions, hints, and placeholders. No trailing periods on short descriptions. Boolean descriptions start with `Whether ...`. Placeholders start with `e.g. ...`.
- **Operations**: follow n8n CRUD vocabulary — `Create`, `Get`, `Get Many`, `Update`, `Delete`, `Create or Update` (upsert). Internal operation values use camelCase (`getAll`, `setValues`).
- **Single-item selects**: use `type: 'resourceLocator'` with `list` and `id` modes. Register a `searchXxx` helper in `nodes/SimplyPrint/common/dropdowns.ts` and wire it under `methods.listSearch` on the node.
- **Delete operations**: always return `{ deleted: true }`.
- **Get Many with >10 fields**: expose a `simplify` boolean and implement a simplifier in `nodes/SimplyPrint/common/simplify.ts` that keeps at most ten useful fields.

See `.ai/` (SimplyPrint's internal developer guide) for the full SimplyPrint-side conventions.

## Testing

Unit tests live in `tests/` and run under Vitest. Cover:

- Pure utilities (`signature.ts`, `customFields.ts`, `startOptions.ts`, `simplify.ts`).
- Webhook lifecycle (`checkExists` / `create` / `delete`) against mocked `IHookFunctions`.
- At least one happy-path `execute()` per resource.

Always run `npm run lint` and `npm test` before a PR.

## Release

Releases are fully automated via GitHub Actions and npm Trusted Publishing (OIDC). There is no long-lived `NPM_TOKEN` in the repo.

1. On `main`, bump the version in `package.json` (semver — `0.x` is pre-1.0, breaking changes can land in minor bumps but must be documented under `### Breaking changes` in the CHANGELOG).
2. Move the `## Unreleased` section of `CHANGELOG.md` under the new version header, then start a fresh `## Unreleased` section for work in progress.
3. Commit and push: `git commit -am "Release vX.Y.Z" && git push origin main`.
4. Tag the commit and push the tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. The `.github/workflows/release.yml` workflow fires on `v*.*.*` tags, runs lint + build + vitest, packs, and publishes to npm with `--provenance`. Check the npm page afterwards for the "Built and signed on GitHub Actions" badge.
6. A GitHub Release is auto-generated with `softprops/action-gh-release` and the `.tgz` attached.

### Re-running a failed release

If a step fails mid-publish (e.g. lint), fix on `main`, delete the tag locally and on the remote (`git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`), then re-tag and push. Do not amend a tag that npm already accepted; create a new patch version instead.

## Submitting for n8n verification

- Ensure the scan passes: `npx @n8n/scan-community-package @simplyprint/n8n-nodes-simplyprint`.
- Ensure the latest npm release was published from the GitHub Actions workflow with provenance (required after May 1, 2026).
- Apply through the [n8n Creator Portal](https://creators.n8n.io) with a pointer to the npm page and this repository.
