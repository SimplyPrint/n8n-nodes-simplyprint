import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintPrintResumedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintPrintResumedTrigger',
	displayName: 'SimplyPrint - Print Resumed',
	description: 'Fires when a paused print resumes',
	event: 'job.resumed',
	sampleData: SAMPLE.printResumed,
}) {}
