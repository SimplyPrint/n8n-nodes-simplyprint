import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintQueueItemDeniedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintQueueItemDeniedTrigger',
	displayName: 'SimplyPrint - Queue Item Denied',
	description: 'Fires when a pending queue item is denied',
	event: 'queue.item_denied',
	sampleData: SAMPLE.queueItemDenied,
}) {}
