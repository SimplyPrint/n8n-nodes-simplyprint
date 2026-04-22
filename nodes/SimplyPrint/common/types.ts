export interface Printer {
	id: number;
	name: string;
	model?: string | null;
	state?: string | null;
	group_id?: number | null;
	serial?: string | null;
}

export interface QueueItem {
	id: number;
	file_id: number;
	file_name?: string | null;
	group_id?: number | null;
	order?: number | null;
	created_at?: string | null;
}

export interface QueueGroup {
	id: number;
	name: string;
}

export interface PrintFile {
	id: number;
	name: string;
	folder_id?: number | null;
	size?: number | null;
	file_type?: string | null;
}

export interface Filament {
	id: number;
	name?: string | null;
	brand?: string | null;
	material?: string | null;
	color_hex?: string | null;
	weight_remaining?: number | null;
}

export interface Tag {
	id: number;
	name: string;
	color?: string | null;
}

export interface CustomField {
	id: number;
	name: string;
	field_type: string;
	entity: string;
}

/**
 * SimplyPrint wraps every JSON response in this envelope.
 * - status: false means the call failed; `message` should explain why.
 * - objects: the endpoint-specific payload.
 */
export interface SimplyprintResponse<T = unknown> {
	status: boolean;
	message?: string;
	objects?: T;
	[key: string]: unknown;
}

/**
 * Envelope sent on incoming webhook deliveries (format = SIMPLYPRINT, default).
 */
export interface WebhookPayload<T = Record<string, unknown>> {
	webhook_id: number;
	event: string;
	timestamp: number;
	data: T;
}
