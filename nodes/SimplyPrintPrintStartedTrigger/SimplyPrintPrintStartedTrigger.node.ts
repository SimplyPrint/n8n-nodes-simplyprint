import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintPrintStartedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintPrintStartedTrigger',
	displayName: 'SimplyPrint - Print Started',
	description: 'Fires when a print job begins on any printer',
	event: 'job.started',
	sampleData: SAMPLE.printStarted,
}) {}
