# n8n community node patterns - field notes

Distilled from the n8n docs and reference community nodes while building `n8n-nodes-simplyprint`. This is a future-you reference, not a tutorial.

## Package layout

- `package.json` must have:
  - `name` beginning with `n8n-nodes-` (community convention, not strictly enforced but the Community Nodes installer filters on this prefix).
  - `keywords: ["n8n-community-node-package"]` so the UI lists the package.
  - `n8n.n8nNodesApiVersion: 1`
  - `n8n.nodes`: array of compiled `.js` paths, one per node (action or trigger).
  - `n8n.credentials`: array of compiled `.js` paths, one per credential class.
- `dist/` is what gets published; source lives in `nodes/`, `credentials/`, compiled by `tsc` + `gulp build:icons` (just copies SVGs into the tree).

## INodeType interface - the three flavours

1. **Programmatic action node** - implement `description` + `execute(this: IExecuteFunctions)`. Read inputs via `this.getInputData()`, loop, call API, return `INodeExecutionData[][]` (outer array is one entry per output port, inner per item).
2. **Declarative action node** - only `description`, with a big `routing` block that maps resource/operation to HTTP requests. Zero code. Good for simple REST wrappers. **Doesn't work for webhook triggers or dynamic loadOptions** - so not usable for us.
3. **Trigger node** - implement `description` + `webhookMethods.default.{checkExists,create,delete}` + `webhook(this: IWebhookFunctions)`. `webhooks: []` on the description declares the incoming HTTP route.

We use **programmatic action** (one node) and **webhook trigger** (15 nodes, generated from a factory).

## Dual authentication pattern

Same pattern Calendly uses:

```ts
description.credentials = [
  { name: 'myOAuth2', required: true, displayOptions: { show: { authentication: ['oAuth2'] } } },
  { name: 'myApi',    required: true, displayOptions: { show: { authentication: ['apiKey'] } } },
];
description.properties = [
  {
    displayName: 'Authentication',
    name: 'authentication',
    type: 'options',
    options: [{ name: 'OAuth2', value: 'oAuth2' }, { name: 'API Key', value: 'apiKey' }],
    default: 'oAuth2',
  },
  ...
];
```

At runtime read `this.getNodeParameter('authentication', 0)` and pass the matching credential type name to `this.helpers.httpRequestWithAuthentication.call(this, credType, options)`.

## `methods.loadOptions` for dynamic dropdowns

Each dropdown-driven parameter uses `type: 'options', typeOptions: { loadOptionsMethod: 'loadX' }`. Then on the node class:

```ts
methods = {
  loadOptions: {
    async loadX(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
      const res = await myApiCall(this, ...);
      return res.map(r => ({ name: r.label, value: r.id }));
    },
  },
};
```

The `this` context for `loadOptions` supports `getNodeParameter`, `getCredentials`, and `helpers.httpRequestWithAuthentication` - same API surface as `execute`.

## Webhook trigger lifecycle

```ts
webhookMethods = {
  default: {
    async checkExists(this: IHookFunctions) { ... },   // called on activation; return true if webhook exists
    async create(this: IHookFunctions)      { ... },   // called if checkExists returns false
    async delete(this: IHookFunctions)      { ... },   // called on deactivation
  },
};

async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const body = this.getBodyData();
  const headers = this.getHeaderData();
  // verify, then return
  return { workflowData: [this.helpers.returnJsonArray([body])] };
}
```

### Persisting webhook id / secret

Use `this.getWorkflowStaticData('node')` - returns a mutable object (per trigger node in a workflow) that n8n persists across executions. Mutate keys directly, no `set()` needed.

### Silent-drop on bad signature

Return `{ noWebhookResponse: true }` (no workflow items produced, HTTP 200 still returned to the sender - fine for webhooks where we don't want to leak that the signature was wrong). Don't throw - that surfaces as a 500 and poisons the delivery retry queue.

## Credentials

- `class MyCred implements ICredentialType` with `name`, `displayName`, `properties: INodeProperties[]`.
- `authenticate: IAuthenticateGeneric` describes how to apply creds to outgoing requests (headers, query string, or body).
- `test: ICredentialTestRequest` is the "Test" button - n8n runs the described request, expects a 2xx.
- OAuth2 credentials `extends = ['oAuth2Api']` and declare `authUrl`, `accessTokenUrl`, `scope`, `authentication: 'header'` as **hidden** properties so the generic OAuth2 runtime picks them up. The user-facing fields (client id/secret/redirect) come from the parent class.
- n8n's OAuth2 callback URL is `https://<host>/rest/oauth2-credential/callback` - shown on the credential creation page; must be whitelisted on the provider side.

## Resource/operation pattern for big nodes

Standard for HubSpot/Slack/Stripe. Properties list:

1. `resource` options dropdown (top-level - what entity).
2. Per-resource `operation` options dropdown with `displayOptions.show: { resource: ['x'] }`.
3. Per-operation fields with `displayOptions.show: { resource: ['x'], operation: ['y'] }`.

Then `execute()` is one big switch on `(resource, operation)`. We follow this exactly.

## Gotchas

- **No `n8n-nodes-base` imports in community packages.** Only `n8n-workflow` is public API. Importing internal modules breaks when n8n changes versions.
- **Icons are resolved relative to the `.node.js` file** (`icon: 'file:xxx.svg'`). You need a copy of the SVG in each node folder - `gulp build:icons` handles that.
- **Static data is workflow-scoped and persists** across activations. Clear it manually in `delete` - don't leave `webhookId` in there after a successful delete.
- **`continueOnFail` lives on the node** (`this.continueOnFail()`), not on the helper. Every action should wrap its loop body in try/catch and respect the flag.
- **n8n lower-cases header names** before handing them to `getHeaderData()`. Our `extractSecretHeader` checks multiple casings defensively in case of upstream proxies that forward the original case.
- **`helpers.returnJsonArray([data])` wraps an object array into `INodeExecutionData[]`** - easier than building `{ json: ... }` objects by hand.

## Docs we leaned on

- [Build a community node](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [Declarative style](https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/) (read, then rejected - we need webhooks)
- [Programmatic style](https://docs.n8n.io/integrations/creating-nodes/build/programmatic-style-node/)
- [Credentials reference](https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/)
- [Install community nodes (GUI)](https://docs.n8n.io/integrations/community-nodes/installation/gui-install/)

## Reference nodes we studied

- [n8n-io/n8n:packages/nodes-base/nodes/Calendly](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes/Calendly) - webhook trigger with dual OAuth2/APIkey auth. Closest template to our triggers.
- [n8n-io/n8n:packages/nodes-base/nodes/HubSpot](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes/HubSpot) - big resource/operation node. Template for `SimplyPrint.node.ts`.
- [n8n-io/n8n:packages/nodes-base/nodes/Slack](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes/Slack) - loadOptions patterns.
