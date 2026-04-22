# Changelog

All notable changes to `n8n-nodes-simplyprint` are documented here.

## 0.2.7

- Strip `always-auth=false` from setup-node's .npmrc in addition to `_authToken`, since npm may interpret it as "user explicitly disabled auth" and skip OIDC. Also install `npm@latest` on the runner (Node 24's bundled npm 11.11 may have incomplete Trusted Publishing detection).

## 0.2.6

- Strip _authToken from the correct .npmrc path. setup-node writes its .npmrc at `$NPM_CONFIG_USERCONFIG` (typically `/home/runner/work/_temp/.npmrc`), not at `~/.npmrc`. The 0.2.5 strip step was a no-op because it looked at the wrong path, so npm kept reading the empty-token line and bypassing OIDC.

## 0.2.5

- Restore Trusted Publishing (OIDC) in the release workflow. Root cause of the earlier failures: `setup-node` with `registry-url` writes `~/.npmrc` with a line `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`. With no NPM_TOKEN set, that expands to an empty token, and npm uses empty-token auth instead of falling through to OIDC. Stripped that line after setup-node runs so npm 11 sees "no configured auth" and triggers the OIDC exchange. Added a one-shot diagnostic step that dumps OIDC claims so we can verify the exchange.

## 0.2.4

- (Never published.) Attempted NPM_TOKEN fallback, reverted before release.

## 0.2.3

- Remove `registry-url` from setup-node so no `.npmrc` auth template is written. With that template present, npm preferred empty-token auth over OIDC and 404'd on publish even with Trusted Publishing correctly configured.

## 0.2.2

- Switch the release workflow to Node 24 (which ships npm 11) to unblock Trusted Publishing. The previous attempt to run `npm install -g npm@latest` on Node 22 left npm in a broken state (MODULE_NOT_FOUND: promise-retry). No code changes since 0.2.0.

## 0.2.1

- Re-release of 0.2.0 content. The 0.2.0 tag never made it to npm: the release workflow's runner had npm 10.9.x (Node 22's bundled version), which signs a provenance attestation but silently falls back to token auth for the actual publish PUT, 404-ing against a scoped package. 0.2.1 attempted to fix by upgrading npm in-place on Node 22 — broke npm itself. See 0.2.2.

## 0.2.0

- Collapse 15 per-event trigger classes into a single `SimplyPrint Trigger` node with an Event dropdown. This matches the pattern used by first-party n8n integrations (HubSpot, Slack, Stripe) and makes the triggers appear correctly under the SimplyPrint integration card in the Node Creator (previously every event rendered as its own standalone card and the integration overview showed "No SimplyPrint Triggers available").
- Default both credentials' `Panel URL` to `https://simplyprint.io` (production) instead of the staging host.
- Drop the internal `install-on-home-server.sh` dev-loop script from the repo.

## 0.1.0 - Initial release

- Dual authentication (OAuth2 or API key) via a per-node authentication selector
- Main `SimplyPrint` action node with 8 resources and ~30 operations
- Custom API Call resource as an escape hatch for any unwrapped endpoint
- 15 webhook-based trigger nodes, one per SimplyPrint event
- Dynamic loadOptions dropdowns for printers, files, queue items, queue groups, filaments, tags and custom fields
- Constant-time webhook signature verification against per-workflow secrets
