import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

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
import { envelope } from '../SimplyPrint/common/samples';

interface FactoryOptions<Payload extends object> {
	/** Internal camelCase node name - never rename after publish. */
	nodeName: string;
	displayName: string;
	description: string;
	/** SimplyPrint WebhookEvent string (e.g. 'job.done'). */
	event: string;
	sampleData: Payload;
}

interface StoredWebhook extends IDataObject {
	webhookId: number;
	secret: string;
}

/**
 * Factory that builds one n8n trigger node class per SimplyPrint event.
 * Each resulting node:
 *
 * - Registers a per-workflow webhook on activation (`POST /webhooks/Create`).
 * - Drops events whose `X-SP-Secret` header doesn't match the stored secret.
 * - Deletes its webhook on deactivation (`POST /webhooks/Delete`).
 */
export function createWebhookEventTriggerNode<Payload extends object>(
	opts: FactoryOptions<Payload>,
): new () => INodeType {
	class Trigger implements INodeType {
		description: INodeTypeDescription = {
			displayName: opts.displayName,
			name: opts.nodeName,
			icon: 'file:simplyprint.svg',
			group: ['trigger'],
			version: 1,
			description: opts.description,
			defaults: { name: opts.displayName },
			inputs: [],
			outputs: [NodeConnectionType.Main],
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
					displayName:
						'When this workflow is active, n8n registers a dedicated SimplyPrint webhook for the <b>' +
						opts.displayName +
						'</b> event (and removes it when the workflow is deactivated). Every delivery is verified with a unique per-workflow secret.',
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
						}
						return exists;
					} catch {
						// If we cannot reach SimplyPrint right now, treat as present and let
						// `create` re-register on the next activation attempt.
						return true;
					}
				},

				async create(this: IHookFunctions): Promise<boolean> {
					const webhookUrl = this.getNodeWebhookUrl('default');
					if (!webhookUrl) return false;

					const secret = generateWebhookSecret();
					const res = await simplyprintCall<{ webhook?: { id: number } }>(this, {
						method: 'POST',
						path: 'webhooks/Create',
						body: {
							name: `n8n: ${opts.displayName}`,
							description: `Per-workflow webhook from n8n (${opts.nodeName}). Auto-managed - do not edit.`,
							url: webhookUrl,
							events: [opts.event],
							secret,
							enabled: true,
						},
					});

					const webhookId = res.objects?.webhook?.id;
					if (!webhookId) return false;

					const workflowData = this.getWorkflowStaticData('node') as StoredWebhook;
					workflowData.webhookId = webhookId;
					workflowData.secret = secret;
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
						// Best effort - webhook may already be gone (revoked app, panel delete).
					}
					delete workflowData.webhookId;
					delete workflowData.secret;
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

	// Preserve sampleData on the instance for the n8n flow builder preview by
	// attaching a synthetic "sample" property. n8n doesn't have a first-class
	// sampleData concept on webhook triggers, but keeping it exported lets
	// future tooling surface it, and the factory's `opts.sampleData` + envelope()
	// remain a single source of truth alongside samples.ts.
	(Trigger.prototype as unknown as { sample: object }).sample = envelope(
		opts.event,
		opts.sampleData,
	);

	return Trigger;
}
