/**
 * Realistic sample payloads for each webhook trigger. Derived from
 * SimplyPrint's webhook formatter classes. Shown in the n8n UI via
 * `Listen for event` so users can map fields before a real event
 * arrives. Mirrors the Activepieces piece samples.
 */

const jobSample = {
	id: 456,
	printer_id: 123,
	printer_name: 'Prusa MK4 - bed 1',
	file_name: 'benchy.gcode',
	original_filename: 'benchy.gcode',
	started: '2026-04-21T12:00:00Z',
	ended: '2026-04-21T13:00:00Z',
	duration_seconds: 3600,
	user_id: 7,
	status: 'completed',
};

const printerSample = {
	id: 123,
	name: 'Prusa MK4 - bed 1',
	model: 'Prusa MK4',
	state: 'operational',
	serial: 'SP-123456',
	group_id: 2,
};

const userSample = {
	id: 7,
	name: 'Alex Johnson',
	email: 'alex@example.com',
};

const queueItemSample = {
	id: 890,
	file_id: 321,
	file_name: 'bracket-v2.gcode',
	group_id: 2,
	amount: 5,
	order: 3,
};

const filamentSample = {
	id: 55,
	name: 'Prusament Galaxy Black',
	brand: 'Prusament',
	material: 'PLA',
	color_hex: '#101010',
	weight_remaining: 750,
};

const maintenanceJobSample = {
	id: 77,
	title: 'Replace nozzle',
	printer_id: 123,
	status: 'overdue',
	due_at: '2026-04-20T00:00:00Z',
};

export const SAMPLE = {
	printStarted: { job: jobSample, user: userSample, started_by: userSample },
	printPaused: { job: jobSample, user: userSample },
	printResumed: { job: jobSample, user: userSample },
	printFinished: { job: jobSample },
	printFailed: { job: jobSample },
	printCancelled: { job: jobSample, user: userSample },
	queueItemAdded: { queue_item: queueItemSample, user: userSample },
	queueItemApproved: { queue_item: queueItemSample, user: userSample },
	queueItemDenied: { queue_item: queueItemSample, user: userSample },
	queueItemPendingApproval: { queue_item: queueItemSample, user: userSample },
	filamentAssigned: {
		filament: filamentSample,
		printer: printerSample,
		user: userSample,
		replaced_spool: null,
	},
	filamentUnassigned: {
		filament: filamentSample,
		printer: printerSample,
		user: userSample,
	},
	aiFailureDetected: {
		job: jobSample,
		image: 'https://cdn.simplyprint.io/ai/failure-123.jpg',
		failures: [{ confidence: 0.92, type: 'spaghetti' }],
	},
	maintenanceJobOverdue: { maintenance_job: maintenanceJobSample, printer: printerSample },
	maintenanceProblemReported: {
		problem: { id: 99, title: 'Extruder clicking', printer_id: 123 },
		printer: printerSample,
		user: userSample,
	},
};

export function envelope<T extends object>(event: string, data: T) {
	return {
		webhook_id: 42,
		event,
		timestamp: 1713696000,
		data,
	};
}
