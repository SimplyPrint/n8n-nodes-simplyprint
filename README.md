# n8n-nodes-simplyprint

Community node for [n8n](https://n8n.io) that connects to [SimplyPrint](https://simplyprint.io) - 3D print farm management platform.

## What's in the box

- **1 action node** (`SimplyPrint`) with resource/operation split covering ~30 operations across Printers, Queue, Files, Filaments, Organization, Custom Fields, Webhooks and Statistics, plus a **Custom API Call** escape hatch.
- **1 trigger node** (`SimplyPrint Trigger`) with an Event dropdown covering 15 webhook events (Print Started, Print Finished, Queue Item Added, Filament Assigned, AI Failure Detected, Maintenance Problem Reported, ...). Each event is also surfaced as its own card in the n8n Node Creator.
- **Dual authentication**: OAuth2 (recommended) or API key. Pick per-connection.

## Install

### Via n8n UI (self-hosted)

1. In n8n, open **Settings -> Community Nodes**.
2. Click **Install a community node**.
3. Enter `@simplyprint/n8n-nodes-simplyprint` and click **Install**.
4. Restart n8n if prompted.

Requires `N8N_COMMUNITY_PACKAGES_ENABLED=true` (default in recent n8n versions).

### Via npm (manual)

```bash
cd ~/.n8n
npm install @simplyprint/n8n-nodes-simplyprint
```

## Use

1. In any workflow, search for **SimplyPrint** to add a trigger (e.g. *Print Finished*) or action.
2. On the node, click **Create Credential**, pick **OAuth2** or **API key**, connect, save.
3. For OAuth2, you'll be redirected to `simplyprint.io` - sign in, pick the account, approve.
4. For API key: generate the key in **Panel -> Settings -> API Keys** and paste it along with the numeric Company ID (visible in panel URL: `simplyprint.io/panel/<id>/...`).

## Compatibility

Tested against n8n `>=1.0`. No known incompatibilities.

## Resources

- [Full help desk article](https://help.simplyprint.io)
- [SimplyPrint API reference](https://apidocs.simplyprint.io)
- [Source](https://github.com/simplyprint/n8n-nodes-simplyprint)

## License

[MIT](LICENSE.md)
