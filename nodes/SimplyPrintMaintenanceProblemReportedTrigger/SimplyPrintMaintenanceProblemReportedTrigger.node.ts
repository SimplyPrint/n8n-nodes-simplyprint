import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintMaintenanceProblemReportedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintMaintenanceProblemReportedTrigger',
	displayName: 'SimplyPrint - Maintenance Problem Reported',
	description: 'Fires when a user reports a maintenance problem on a printer',
	event: 'maintenance.problem_reported',
	sampleData: SAMPLE.maintenanceProblemReported,
}) {}
