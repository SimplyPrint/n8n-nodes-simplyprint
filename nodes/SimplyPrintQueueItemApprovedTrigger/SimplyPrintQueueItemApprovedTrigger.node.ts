import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintQueueItemApprovedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintQueueItemApprovedTrigger',
	displayName: 'SimplyPrint - Queue Item Approved',
	description: 'Fires when a pending queue item is approved',
	event: 'queue.item_approved',
	sampleData: SAMPLE.queueItemApproved,
}) {}
