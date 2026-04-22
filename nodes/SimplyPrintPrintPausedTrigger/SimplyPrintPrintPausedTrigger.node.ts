import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintPrintPausedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintPrintPausedTrigger',
	displayName: 'SimplyPrint - Print Paused',
	description: 'Fires when an in-progress print is paused',
	event: 'job.paused',
	sampleData: SAMPLE.printPaused,
}) {}
