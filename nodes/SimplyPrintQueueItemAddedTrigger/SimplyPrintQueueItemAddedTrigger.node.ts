import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintQueueItemAddedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintQueueItemAddedTrigger',
	displayName: 'SimplyPrint - Queue Item Added',
	description: 'Fires when a new item is added to the print queue',
	event: 'queue.add_item',
	sampleData: SAMPLE.queueItemAdded,
}) {}
