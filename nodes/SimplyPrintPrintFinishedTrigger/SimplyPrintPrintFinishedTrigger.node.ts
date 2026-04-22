import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintPrintFinishedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintPrintFinishedTrigger',
	displayName: 'SimplyPrint - Print Finished',
	description: 'Fires when a print completes successfully',
	event: 'job.done',
	sampleData: SAMPLE.printFinished,
}) {}
