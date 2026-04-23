import type { IDataObject } from 'n8n-workflow';

/**
 * n8n UX guideline: when an endpoint returns data with more than 10 fields,
 * expose a "Simplify" boolean that returns a trimmed version. Each of these
 * helpers picks the ten most useful fields for the corresponding SimplyPrint
 * entity and flattens nested shapes where helpful.
 *
 * Pass the raw response object through verbatim when Simplify is off.
 */

function pick(obj: IDataObject, keys: string[]): IDataObject {
	const out: IDataObject = {};
	for (const k of keys) {
		if (obj[k] !== undefined) out[k] = obj[k];
	}
	return out;
}

export function simplifyPrinter(raw: IDataObject): IDataObject {
	const job = (raw.current_job ?? raw.job) as IDataObject | undefined;
	return {
		id: raw.id,
		name: raw.name,
		model: raw.model,
		state: raw.state ?? raw.status,
		online: raw.online,
		temperature:
			typeof raw.temperatures === 'object' && raw.temperatures !== null
				? (raw.temperatures as IDataObject)
				: undefined,
		progress: job?.progress ?? raw.progress,
		currentFile: job?.file_name ?? raw.current_file,
		timeLeft: job?.time_left ?? raw.time_left,
		lastSeen: raw.last_seen,
	};
}

export function simplifyQueueItem(raw: IDataObject): IDataObject {
	return pick(raw, [
		'id',
		'file_id',
		'file_name',
		'group_id',
		'amount',
		'done',
		'position',
		'note',
		'created_at',
		'status',
	]);
}

export function simplifyQueueGroup(raw: IDataObject): IDataObject {
	return pick(raw, ['id', 'name', 'description', 'default', 'items_count', 'printer_ids']);
}

export function simplifyPrintHistory(raw: IDataObject): IDataObject {
	return pick(raw, [
		'id',
		'file_name',
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
