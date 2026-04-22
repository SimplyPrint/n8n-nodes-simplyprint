import { createWebhookEventTriggerNode } from '../common/createWebhookEventTrigger';
import { SAMPLE } from '../SimplyPrint/common/samples';

export class SimplyPrintFilamentUnassignedTrigger extends createWebhookEventTriggerNode({
	nodeName: 'simplyPrintFilamentUnassignedTrigger',
	displayName: 'SimplyPrint - Filament Unassigned',
	description: 'Fires when a filament spool is removed from a printer',
	event: 'filament.unassigned',
	sampleData: SAMPLE.filamentUnassigned,
}) {}
