import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintMaintenanceJobOverdueTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintMaintenanceJobOverdueTrigger',
	displayName: 'SimplyPrint - Maintenance Job Overdue',
	description: 'Fires when a scheduled maintenance task passes its due date',
	event: 'maintenance.job_overdue',
	sampleData: SAMPLE.maintenanceJobOverdue,
}) {}
