import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintPrintCancelledTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintPrintCancelledTrigger',
	displayName: 'SimplyPrint - Print Cancelled',
	description: 'Fires when a user cancels a print',
	event: 'job.cancelled',
	sampleData: SAMPLE.printCancelled,
}) {}
