import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintAiFailureDetectedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintAiFailureDetectedTrigger',
	displayName: 'SimplyPrint - AI Failure Detected',
	description: 'Fires when the AI failure detection system flags a problem during a print',
	event: 'ai.failure_detected',
	sampleData: SAMPLE.aiFailureDetected,
}) {}
