import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintPrintFailedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintPrintFailedTrigger',
	displayName: 'SimplyPrint - Print Failed',
	description: 'Fires when a print ends in failure',
	event: 'job.failed',
	sampleData: SAMPLE.printFailed,
}) {}
