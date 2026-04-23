# Changelog

All notable changes to `n8n-nodes-simplyprint` are documented here.

## 0.3.5

- **Staff test build on the `latest` tag.** Same code as the 0.4.0 work (see below) but published as 0.3.5 so the n8n UI's "Install a community node" flow offers it without requiring the `@beta` selector. Default `panelUrl` in both credentials points at `https://test.simplyprint.io` for end-to-end validation. Production users should pin to 0.3.4 or override `panelUrl` on the credential until the real 0.4.0 ships with the prod URL restored.

## 0.4.0 (staged, not yet published)

### Breaking changes

- **File > Upload now targets `files.simplyprint.io` (the integration-reachable upload API).** `POST /files/Upload` on `api.simplyprint.io` rejects API-key and OAuth requests (`$can_upload = isAppRequest() || isPanelRequest()` in `Upload.php`) — it is reserved for the web panel and mobile-app clients. This release switches the multipart upload to the dedicated `https://files.simplyprint.io/{company}/files/Upload` service, which returns a hex bucket-hash file id. The return shape of `File > Upload` changes: `fileId` is now a **string hash** rather than a numeric id. Requires the Print Farm plan on the account.
- **Category / sub-category enums are now lowercase strings.** The backend `CustomFieldsSubmitController` only accepts lowercase values (`print`, `printer`, `filament`, `user_file`, `user` for category; `print_queue`, `print_job`, `user_file` for sub-category). Previous releases posted uppercase enum names and would fail validation.
- **Operation renames.** All `List` operations have been renamed to `Get Many` (per n8n vocabulary). The underlying `value` has changed from `list` / `listItems` / `listGroups` / etc. to `getAll`. Expression references to the old operation values must be updated.
- **Single-entity selects are now Resource Locators.** The `printerId`, `fileId`, `filamentId`, and `queueItemId` parameters now use the `resourceLocator` component with `list` and `id` modes. Existing workflows keep working because the default mode is `list`, but workflows that assigned a raw numeric value via expression may need to wrap it as `{ __rl: true, mode: 'id', value: N }`.

### Migration from 0.3.x

1. **File > Upload consumers**: if a downstream node consumed the numeric `fileId` returned by the old upload operation, update it to handle a hex string. `File > Upload and Queue` and `Print Job > Create` handle the new id transparently.
2. **Operation value refs**: search workflows for `"operation": "list"` / `"listItems"` / `"listGroups"` and replace with `"getAll"`.
3. **OAuth2 Print Farm plan**: the `files.simplyprint.io` host is only enabled for accounts on the Print Farm plan. Accounts on Hobby / Maker tiers should stay on 0.3.x until they upgrade.

### New features

- **Print Job resource with Create operation.** Wraps `printers/actions/CreateJob` so a workflow can start a print on one or more printers without dropping to Custom API Call. Supports user-file or queue-item sources, shared PRINT_JOB custom fields, per-printer overrides, start options, and MMS slot mappings.
- **File > Upload and Queue composite.** One operation uploads the binary, queues it, and optionally starts a print on a CSV list of printer IDs using `queue_file`. Supports both PRINT_QUEUE custom fields (on the queue item) and PRINT_JOB custom fields (on the started job).
- **Custom fields on Upload and Add to Queue.** Queue items can carry PRINT_QUEUE custom fields in the same call via a Custom Fields fixed-collection. Values are submitted as the backend-shape array `[{customFieldId, value}]`; categories are inferred server-side.
- **Custom Field > Submit Values rewritten for the multi-field endpoint.** Input is now a fixed-collection of `{customFieldId, type, value}` rows, targeting one or more entity IDs under a chosen category + optional sub-category. Old single-field flows keep working via a compatibility shim that synthesizes a one-row submission.
- **`Simplify` option on Get Many operations.** Printer, Queue, and Print Job list operations now expose a `simplify` boolean that reduces the response to the 10 most useful fields.

### Bug fixes

- **`custom_fields/SubmitValues` endpoint.** Earlier versions POSTed to `custom_fields/SetValues`, which does not exist — the operation would always fail with a 404. This release restores the feature.
- **Graceful 403 on custom-field dropdowns.** `loadCustomFields` catches the 403 that OAuth callers get today (the backend marks `custom_fields/Get` as `oauth_disabled`) and returns an empty option list rather than breaking the UI. Use the List operation + paste the UUID into the Custom Field ID column until the backend flip lands.

### Release hygiene

- Delete operations now return `{ deleted: true }` per n8n UX convention.
- Canonical SVG icon replaces the previous raster PNG; `eslint-plugin-n8n-nodes-base` runs with no per-line suppressions.
- `package.json` gains `bugs.url`, `engines.node`, and a properly typed `repository` object. `@n8n/node-cli` is pinned as a devDependency so `npx @n8n/scan-community-package` can run in CI.
- Codex metadata (`SimplyPrint.node.json`, `SimplyPrintTrigger.node.json`) added so the node appears with the right categories and docs URL in n8n's verified directory.

## 0.3.4

- Revert scope format back to space-separated (per RFC 6749). League's OAuth2 server parses scope by space; comma-separated caused League to see one giant "user.read,printers.read,..." scope name that isn't registered, triggering `invalid_scope`. SP's `comma_separated` validator turns out to be a no-op without a type parameter, so spaces work fine for that layer.

## 0.3.3

- Send OAuth scopes as comma-separated instead of space-separated. SP's `/api/0/oauth2/Authorize` uses a custom `comma_separated` validator on the scope param (non-standard; RFC 6749 specifies space-separated), which caused the whole scope string to be treated as a single invalid value and the authorize request was rejected as malformed.

## 0.3.2

- Actual fix for the OAuth URL. The consent screen is at `/panel/oauth2/authorize` (the route is declared with a `Pattern()` helper in `panel-routes.php` that prepends `/panel` when not in OEM mode). 0.3.1 used `/oauth2/authorize` which 404'd.

## 0.3.1

- Fix OAuth2 endpoint URLs. `/oauth/authorize` and `/oauth/token` route to SimplyPrint's MCP OAuth flow (Dynamic Client Registration, different client registry). The Activepieces-compatible pre-registered client flow lives at `/oauth2/authorize` (panel consent page) and `/api/0/oauth2/Token` (token exchange). 0.3.0 used the wrong pair and was rejected with "Unknown OAuth client".

## 0.3.0

- **Zero-config OAuth2.** The `SimplyPrint OAuth2 API` credential no longer asks for client ID / client secret / redirect URL - just click **Connect**. The node ships with a shared SimplyPrint-managed OAuth client that accepts any n8n callback URL. On first use for an unknown n8n instance, the SimplyPrint consent screen shows a warning with the redirect URL and a mandatory trust checkbox.
- Existing users who previously set up OAuth with their own client ID and secret should delete the old credential and create a new one; the hidden defaults now populate everything automatically.

## 0.2.8

- Stop relying on npm 11's auto-OIDC-detection (which wasn't firing on the runner for unknown reasons) and do the OIDC token exchange manually: curl the GitHub OIDC endpoint with audience `npm:registry.npmjs.org`, POST the resulting JWT to npm's token-exchange endpoint, use the returned short-lived publish token for `npm publish`.

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
