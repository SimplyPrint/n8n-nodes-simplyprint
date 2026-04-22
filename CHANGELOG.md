# Changelog

All notable changes to `n8n-nodes-simplyprint` are documented here.

## 0.2.4

- Fall back to classic NPM_TOKEN for publish auth. Trusted Publishing did not fire reliably on this runner setup (kept falling back to empty-token auth). OIDC can be revisited later.

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
