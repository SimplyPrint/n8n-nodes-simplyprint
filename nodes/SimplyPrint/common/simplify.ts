import type { IDataObject } from 'n8n-workflow';

/**
 * n8n UX guideline: endpoints returning > 10 fields should expose a
 * "Simplify" boolean. Each helper here picks the most useful fields and
 * flattens nested shapes where helpful. Pass the raw through when off.
 *
 * Canonical field names (these differ from what the n8n node historically
 * assumed — source-of-truth is the SimplyPrint backend entity
 * getFormattedData() methods):
 *   - PrintQueueItem: `filename` (not file_name), `group` (not group_id),
 *     `sort_order` (not order), `filesystem_id`, `user_id`, `left`, `printed`,
 *     `added`.
 *   - Printer row (from printers/Get): top level is `{ id, sort_order,
 *     printer: {...}, filament, job }` — the printer's own name/state/group/
 *     model live UNDER `.printer`. `printer.model` is a PrinterModel object
 *     `{id, name, brand, ...}` when expanded by the backend.
 *   - User object: `{ id, sso, first_name, last_name, avatar }` — no
 *     combined `name` field. Concat first + last for display.
 */

function pick(obj: IDataObject, keys: string[]): IDataObject {
	const out: IDataObject = {};
	for (const k of keys) {
		if (obj[k] !== undefined) out[k] = obj[k];
	}
	return out;
}

export function userDisplayName(user: IDataObject | null | undefined): string | undefined {
	if (!user) return undefined;
	const first = (user.first_name as string | undefined) ?? '';
	const last = (user.last_name as string | undefined) ?? '';
	const full = `${first} ${last}`.trim();
	return full || undefined;
}

export function simplifyPrinter(raw: IDataObject): IDataObject {
	// `printers/Get` row: `{ id, sort_order, printer: {...}, filament, job }`.
	const printer = (raw.printer ?? {}) as IDataObject;
	const job = (raw.job ?? {}) as IDataObject;
	const filament = raw.filament;
	const model = printer.model as IDataObject | string | null | undefined;
	const modelName = typeof model === 'string' ? model : (model as IDataObject | undefined)?.name;

	return {
		id: raw.id,
		name: printer.name,
		model: modelName,
		state: printer.state,
		group: printer.group,
		groupName: printer.groupName,
		online: printer.online,
		currentFile: job.filename ?? null,
		progress: job.progress ?? null,
		timeLeft: job.time_left ?? null,
		filament: filament ?? null,
	};
}

export function simplifyQueueItem(raw: IDataObject): IDataObject {
	// Canonical queue-item fields per PrintQueueItem::getFormattedData().
	return pick(raw, [
		'id',
		'filename',
		'filesystem_id',
		'group',
		'sort_order',
		'amount',
		'left',
		'printed',
		'user_id',
		'added',
	]);
}

export function simplifyQueueGroup(raw: IDataObject): IDataObject {
	return pick(raw, ['id', 'name', 'description', 'default', 'items_count', 'printer_ids']);
}

export function simplifyPrintHistory(raw: IDataObject): IDataObject {
	return pick(raw, [
		'id',
		'filename',
		'printer_id',
		'started_at',
		'ended_at',
		'duration',
		'status',
		'filament_used',
		'user_id',
		'group_id',
	]);
}

export function simplifyTag(raw: IDataObject): IDataObject {
	return pick(raw, ['id', 'name', 'color']);
}

export function applySimplify<T extends IDataObject | IDataObject[]>(
	value: T,
	simplify: boolean,
	mapper: (row: IDataObject) => IDataObject,
): IDataObject | IDataObject[] {
	if (!simplify) return value;
	if (Array.isArray(value)) return value.map(mapper);
	return mapper(value);
}
