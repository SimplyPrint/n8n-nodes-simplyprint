/**
 * A row from `printers/Get` — the printer-level fields (name/state/group/model)
 * live under `.printer`. `model` is a `PrinterModel` object when expanded by
 * the backend.
 */
export interface PrinterRow {
	id: number;
	sort_order?: number;
	printer?: {
		name?: string;
		state?: string;
		group?: number;
		groupName?: string;
		online?: boolean;
		model?: { id?: number; name?: string; brand?: string } | string | null;
	};
	filament?: unknown;
	job?: {
		filename?: string;
		progress?: number;
		time_left?: number;
	};
}

/**
 * A row from `queue/GetItems`. Canonical field names per
 * `PrintQueueItem::getFormattedData()` — note `filename` (not file_name),
 * `group` (not group_id), `sort_order` (not order), `filesystem_id`.
 */
export interface QueueItem {
	id: number;
	filename?: string | null;
	filesystem_id?: string | null;
	group?: number | null;
	sort_order?: number | null;
	amount?: number | null;
	left?: number | null;
	printed?: number | null;
	user_id?: number | null;
	added?: string | null;
}

export interface QueueGroup {
	id: number;
	name: string;
}

/**
 * A row from `files/GetFiles`. Primary identifier is the hex string `uid`,
 * not a numeric `id`. Most single-file operations accept `uid` as the
 * identifier (string).
 */
export interface PrintFile {
	uid: string;
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
