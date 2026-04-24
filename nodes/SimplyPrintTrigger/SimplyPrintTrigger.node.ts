import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { simplyprintCall } from '../SimplyPrint/common/client';
import {
	authenticationProperty,
	SIMPLYPRINT_CREDENTIALS,
} from '../SimplyPrint/common/authSelector';
import {
	generateWebhookSecret,
	verifySimplyprintSignature,
	extractSecretHeader,
} from '../SimplyPrint/common/signature';

/**
 * Each option's `value` is the SimplyPrint WebhookEvent string registered on
 * the webhook subscription; `action` is the imperative phrase n8n's Node
 * Creator uses to render a per-event card under the SimplyPrint integration.
 *
 * The `name` of this property MUST stay `event` - n8n's triggersCategory()
 * helper in useActionsGeneration.ts auto-expands properties named `event`
 * into virtual trigger entries, which is how the 15 events appear under the
 * single SimplyPrint integration card in the UI.
 */
const EVENT_OPTIONS = [
	{
		name: 'AI Failure Detected',
		value: 'printer.ai_failure_detected',
		action: 'AI failure detected',
		description: 'Fires when SimplyPrint AI flags a print as failing',
	},
	{
		name: 'Filament Assigned',
		value: 'filament.assigned',
		action: 'Filament assigned',
		description: 'Fires when a filament spool is assigned to a printer',
	},
	{
		name: 'Filament Unassigned',
		value: 'filament.unassigned',
		action: 'Filament unassigned',
		description: 'Fires when a filament spool is removed from a printer',
	},
	{
		name: 'Maintenance Job Overdue',
		value: 'maintenance.job_overdue',
		action: 'Maintenance job overdue',
		description: 'Fires when a scheduled maintenance job passes its due date',
	},
	{
		name: 'Maintenance Problem Reported',
		value: 'maintenance.problem_reported',
		action: 'Maintenance problem reported',
		description: 'Fires when a user reports a problem with a printer',
	},
	{
		name: 'Print Cancelled',
		value: 'job.cancelled',
		action: 'Print cancelled',
		description: 'Fires when an in-progress print is cancelled',
	},
	{
		name: 'Print Failed',
		value: 'job.failed',
		action: 'Print failed',
		description: 'Fires when a print ends with failure status',
	},
	{
		name: 'Print Finished',
		value: 'job.done',
		action: 'Print finished',
		description: 'Fires when a print completes successfully',
	},
	{
		name: 'Print Paused',
		value: 'job.paused',
		action: 'Print paused',
		description: 'Fires when an in-progress print is paused',
	},
	{
		name: 'Print Resumed',
		value: 'job.resumed',
		action: 'Print resumed',
		description: 'Fires when a paused print is resumed',
	},
	{
		name: 'Print Started',
		value: 'job.started',
		action: 'Print started',
		description: 'Fires when a print job begins on any printer',
	},
	{
		name: 'Queue Item Added',
		value: 'queue.add_item',
		action: 'Queue item added',
		description: 'Fires when a new item is added to the print queue',
	},
	{
		name: 'Queue Item Approved',
		value: 'queue.item_approved',
		action: 'Queue item approved',
		description: 'Fires when a pending queue item is approved by a reviewer',
	},
	{
		name: 'Queue Item Denied',
		value: 'queue.item_denied',
		action: 'Queue item denied',
		description: 'Fires when a pending queue item is denied by a reviewer',
	},
	{
		name: 'Queue Item Pending Approval',
		value: 'queue.item_pending_approval',
		action: 'Queue item pending approval',
		description: 'Fires when a queue item enters the pending-approval state',
	},
];

interface StoredWebhook extends IDataObject {
	webhookId?: number;
	secret?: string;
	event?: string;
}

export class SimplyPrintTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SimplyPrint Trigger',
		name: 'simplyPrintTrigger',
		icon: 'file:simplyprint.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts a workflow when SimplyPrint emits a selected event',
		defaults: { name: 'SimplyPrint Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: SIMPLYPRINT_CREDENTIALS,
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			authenticationProperty,
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: EVENT_OPTIONS,
				default: 'job.done',
				required: true,
				description: 'SimplyPrint event that starts this workflow',
			},
			{
				displayName:
					'When this workflow is active, n8n registers a dedicated SimplyPrint webhook for the selected event (and removes it when the workflow is deactivated). Every delivery is verified with a unique per-workflow secret.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const workflowData = this.getWorkflowStaticData('node') as StoredWebhook;
				if (!workflowData.webhookId) return false;

				try {
					const res = await simplyprintCall<{ data?: Array<{ id: number; url?: string }> }>(
						this,
						{ method: 'GET', path: 'webhooks/Get' },
					);
					const hooks = res.objects?.data ?? [];
					const exists = hooks.some(
						(h) => h.id === workflowData.webhookId && (!h.url || h.url === webhookUrl),
					);
					if (!exists) {
						delete workflowData.webhookId;
						delete workflowData.secret;
						delete workflowData.event;
					}
					return exists;
				} catch {
					// If SimplyPrint is unreachable, assume present and let `create`
					// re-register on the next activation attempt.
					return true;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) return false;

				const event = this.getNodeParameter('event') as string;
				const eventMeta = EVENT_OPTIONS.find((o) => o.value === event);
				const eventLabel = eventMeta?.name ?? event;

				const secret = generateWebhookSecret();
				const res = await simplyprintCall<{ webhook?: { id: number } }>(this, {
					method: 'POST',
					path: 'webhooks/Create',
					body: {
						name: `n8n: ${eventLabel}`,
						description: `Auto-managed by n8n. Workflow-scoped webhook for the ${event} event - do not edit.`,
						url: webhookUrl,
						events: [event],
						secret,
						enabled: true,
					},
				});

				const webhookId = res.objects?.webhook?.id;
				if (!webhookId) return false;

				const workflowData = this.getWorkflowStaticData('node') as StoredWebhook;
				workflowData.webhookId = webhookId;
				workflowData.secret = secret;
				workflowData.event = event;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const workflowData = this.getWorkflowStaticData('node') as StoredWebhook;
				if (!workflowData.webhookId) return true;

				try {
					await simplyprintCall(this, {
						method: 'POST',
						path: 'webhooks/Delete',
						body: { id: workflowData.webhookId },
					});
				} catch {
					// Best effort - the webhook may already be gone (revoked app, panel delete).
				}
				delete workflowData.webhookId;
				delete workflowData.secret;
				delete workflowData.event;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const headerData = this.getHeaderData() as Record<string, string | string[] | undefined>;
		const bodyData = this.getBodyData();
		const workflowData = this.getWorkflowStaticData('node') as StoredWebhook;

		const headerSecret = extractSecretHeader(headerData);
		if (!verifySimplyprintSignature(headerSecret, workflowData.secret)) {
			// Silent drop - forged, stale, or rotated secret.
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray([bodyData as IDataObject])],
		};
	}
}
