import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintFilamentAssignedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintFilamentAssignedTrigger',
	displayName: 'SimplyPrint - Filament Assigned',
	description: 'Fires when a filament spool is assigned to a printer',
	event: 'filament.assigned',
	sampleData: SAMPLE.filamentAssigned,
}) {}
