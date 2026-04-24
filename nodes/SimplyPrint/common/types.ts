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
 * SimplyPrint envelope for JSON responses. Payload fields are NOT nested
 * under a wrapper key - the server spreads `$this->objects` into the top
 * level via `array_merge($resp, $this->objects)` in AjaxBaseController, so
 * e.g. `webhooks/Create` returns `{ status, message, webhook: {...} }`
 * (NOT `{ status, objects: { webhook: {...} } }`) and `printers/Get` etc.
 * return `{ status, message, data: [...] }`.
 *
 * The generic `T` is spread into the response type to reflect this.
 */
export type SimplyprintResponse<T = Record<string, unknown>> = {
	status: boolean;
	message?: string;
} & T;

/**
 * Envelope sent on incoming webhook deliveries (format = SIMPLYPRINT, default).
 */
export interface WebhookPayload<T = Record<string, unknown>> {
	webhook_id: number;
	event: string;
	timestamp: number;
	data: T;
}
