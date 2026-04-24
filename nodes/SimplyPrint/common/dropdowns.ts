import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';

import { simplyprintCall } from './client';
import type { Filament, Tag, CustomField } from './types';

/**
 * loadOptions + listSearch wiring for the action node.
 *
 * Endpoint paths and response keys (all spread at top level of the SP
 * envelope — no `objects` wrapper):
 *
 *   - `printers/Get`          -> `data: [{ id, sort_order, printer: { name, state, group, model }, filament, job }]`
 *   - `queue/groups/Get`      -> `list: [{ id, name }]` + `groups_exist: bool`
 *   - `queue/GetItems`        -> `queue: [{ id, filename, group, sort_order, ... }]`
 *   - `files/GetFiles`        -> `files: [{ uid, name, ... }]`, query param `f` (-1 = all, 0 = root, N = folder id)
 *   - `filament/GetFilament`  -> `filament: { <id>: { id, brand, material, name, ... } }` (dict keyed by id, not an array)
 *   - `tags/Get`              -> `tags: [{ id, name, color }]` on success; `{ status:false, message }` when no tags exist
 *   - `custom_fields/Get`     -> `data: [{ id, name, field_type, entity }]`, OAuth callers get 403 today
 */

function matches(filter: string | undefined, text: string): boolean {
	if (!filter) return true;
	return text.toLowerCase().includes(filter.toLowerCase());
}

// ---------- Printers ----------
// `printers/Get` returns rows shaped `{ id, sort_order, printer: {...}, filament, job }`
// — the printer name/model/state live under `.printer`.
interface PrinterRow {
	id: number;
	sort_order?: number;
	printer?: {
		name?: string;
		state?: string;
		group?: number;
		model?: { id?: number; name?: string; brand?: string } | string | null;
	};
}

function printerDisplayName(row: PrinterRow): string {
	const name = row.printer?.name ?? `Printer #${row.id}`;
	const model = row.printer?.model;
	const modelLabel =
		typeof model === 'string' ? model : model?.name ?? undefined;
	return modelLabel ? `${name} (${modelLabel})` : name;
}

export async function loadPrinters(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: PrinterRow[] }>(this, {
		method: 'GET',
		path: 'printers/Get',
	});
	const printers = res.data ?? [];
	return printers.map((p) => ({
		name: printerDisplayName(p),
		value: p.id,
	}));
}

export async function searchPrinters(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ data?: PrinterRow[] }>(this, {
		method: 'GET',
		path: 'printers/Get',
	});
	const printers = res.data ?? [];
	const results: INodeListSearchItems[] = printers
		.map((p) => ({ name: printerDisplayName(p), value: p.id }))
		.filter((r) => matches(filter, r.name));
	return { results };
}

// ---------- Queue groups ----------
export async function loadQueueGroups(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ list?: Array<{ id: number; name: string }>; groups_exist?: boolean }>(
		this,
		{ method: 'GET', path: 'queue/groups/Get' },
	);
	const groups = res.list ?? [];
	return groups.map((g) => ({ name: g.name, value: g.id }));
}

// ---------- Files ----------
// `files/GetFiles` returns `{ files: [{ uid, name, ... }], folders: [...] }`.
// The primary id on a file is `uid` (a hex string), not a numeric `id`.
// `f` query param: -1 = all files (flat), 0 = root folder, N = specific folder.
interface FileRow {
	uid: string;
	name: string;
	folder_id?: number | null;
}

export async function loadFiles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ files?: FileRow[] }>(this, {
		method: 'GET',
		path: 'files/GetFiles',
		qs: { f: -1 },
	});
	const files = res.files ?? [];
	return files.map((f) => ({ name: f.name, value: f.uid }));
}

export async function searchFiles(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ files?: FileRow[] }>(this, {
		method: 'GET',
		path: 'files/GetFiles',
		qs: filter ? { f: -1, search: filter, global_search: true } : { f: -1 },
	});
	const files = res.files ?? [];
	const results: INodeListSearchItems[] = files
		.map((f) => ({ name: f.name, value: f.uid }))
		.filter((r) => matches(filter, r.name));
	return { results };
}

// ---------- Queue items ----------
// `queue/GetItems` returns `{ queue: [{ id, filename, group, sort_order, ... }] }`.
// Field names: `filename` (not `file_name`), `group` (not `group_id`),
// `sort_order` (not `order`), `filesystem_id` (string UID on the underlying
// file), `user_id`, `left`, `printed`, `added`.
interface QueueItemRow {
	id: number;
	filename?: string;
	group?: number;
	filesystem_id?: string | null;
}

export async function loadQueueItems(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ queue?: QueueItemRow[] }>(this, {
		method: 'GET',
		path: 'queue/GetItems',
	});
	const items = res.queue ?? [];
	return items.map((i) => ({
		name: i.filename ?? `Queue item #${i.id}`,
		value: i.id,
	}));
}

export async function searchQueueItems(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ queue?: QueueItemRow[] }>(this, {
		method: 'GET',
		path: 'queue/GetItems',
	});
	const items = res.queue ?? [];
	const results: INodeListSearchItems[] = items
		.map((i) => ({
			name: i.filename ?? `Queue item #${i.id}`,
			value: i.id,
		}))
		.filter((r) => matches(filter, r.name));
	return { results };
}

// ---------- Filaments ----------
// `filament/GetFilament` returns `{ filament: { <id>: { id, brand, material, name, ... } } }`
// — a dictionary keyed by id, not an array. Normalise to an array here.
export async function loadFilaments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ filament?: Record<string, Filament> }>(this, {
		method: 'GET',
		path: 'filament/GetFilament',
	});
	const filaments = Object.values(res.filament ?? {});
	return filaments.map((f) => ({
		name: [f.brand, f.material, f.name].filter(Boolean).join(' ') || `Filament #${f.id}`,
		value: f.id,
	}));
}

export async function searchFilaments(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ filament?: Record<string, Filament> }>(this, {
		method: 'GET',
		path: 'filament/GetFilament',
	});
	const filaments = Object.values(res.filament ?? {});
	const results: INodeListSearchItems[] = filaments
		.map((f) => ({
			name: [f.brand, f.material, f.name].filter(Boolean).join(' ') || `Filament #${f.id}`,
			value: f.id,
		}))
		.filter((r) => matches(filter, r.name));
	return { results };
}

// ---------- Tags ----------
// `tags/Get` returns `{ tags: [...] }` on success. When an account has zero
// custom tags the server responds with `status:false` + `message` instead
// of an empty list — treat that as empty here rather than surfacing an error.
export async function loadTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const res = await simplyprintCall<{ tags?: Tag[] }>(this, {
			method: 'GET',
			path: 'tags/Get',
		});
		const tags = res.tags ?? [];
		return tags.map((t) => ({ name: t.name, value: t.id }));
	} catch {
		return [];
	}
}

// ---------- Custom fields ----------
// `custom_fields/Get` is `oauth_disabled = true` server-side today, so OAuth
// callers get a 403. Degrade silently so the UI doesn't explode.
export async function loadCustomFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	try {
		const res = await simplyprintCall<{ data?: CustomField[] }>(this, {
			method: 'GET',
			path: 'custom_fields/Get',
		});
		const fields = res.data ?? [];
		return fields.map((f) => ({
			name: `${f.name} (${f.field_type})`,
			value: f.id,
		}));
	} catch {
		return [];
	}
}
