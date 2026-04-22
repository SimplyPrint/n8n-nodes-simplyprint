import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintQueueItemPendingApprovalTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintQueueItemPendingApprovalTrigger',
	displayName: 'SimplyPrint - Queue Item Pending Approval',
	description: 'Fires when a queue item is created and requires approval',
	event: 'queue.item_pending_approval',
	sampleData: SAMPLE.queueItemPendingApproval,
}) {}
