# n8n-nodes-simplyprint

Community node for [n8n](https://n8n.io) that connects to [SimplyPrint](https://simplyprint.io) - 3D print farm management platform.

## What's in the box

- **1 action node** (`SimplyPrint`) with resource/operation split covering 30+ operations across Printers, Queue, Files, Filaments, Organization, Custom Fields, Print Jobs, Webhooks and Statistics, plus a **Custom API Call** escape hatch.
- **1 trigger node** (`SimplyPrint Trigger`) with an Event dropdown covering 15 webhook events (Print Started, Print Finished, Queue Item Added, Filament Assigned, AI Failure Detected, Maintenance Problem Reported, ...). Each event is also surfaced as its own card in the n8n Node Creator.
- **Dual authentication**: OAuth2 (recommended) or API key. Pick per-connection.

## Upload, queue, print

The hero flow for farm automation is: take a fresh gcode file, drop it on the queue, and start it on a specific printer. Three operations cover it:

- **File -> Upload** adds a binary from the previous node (usually a Read Binary File or HTTP Request) to your SimplyPrint library. Use the optional "File Custom Fields" rows to tag the upload with USER_FILE metadata.
- **File -> Upload and Queue** is the composite shortcut: same upload as above, then adds the resulting file to the print queue with its own set of PRINT_QUEUE custom fields. Set "Start On Printer IDs" (CSV) to also fire a print on each listed printer.
- **Print Job -> Create** wraps `printers/actions/CreateJob`. Pick whether the source is an existing user file or a queue item, add shared PRINT_JOB custom fields (applied to every target), or paste per-printer overrides as JSON into "Individual Custom Fields". Start options and MMS slot mappings are optional JSON fields.

### Custom field IDs

Every custom-field row needs the field's **string UUID**, not the numeric ID. Run **Custom Field -> List** once to find the `fieldId` for each field you care about, then paste the UUID into the "Custom Field ID" column of the fixedCollection. The "Type" dropdown controls how n8n coerces the string value before sending (text, number, boolean, date, or raw JSON).

### Setting custom field values after the fact

**Custom Field -> Submit Values** writes one or more custom-field values to a list of existing entities (queue items, files, print jobs, filaments, or printers). Pick the category, optionally a sub-category, paste comma-separated entity IDs, and add one row per field you want to set. Old flows that stored a single `customFieldId` + `value` still run via a compatibility shim.

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
