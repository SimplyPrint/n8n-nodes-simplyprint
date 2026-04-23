import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';

import { simplyprintCall } from './client';
import type {
	Printer,
	QueueGroup,
	QueueItem,
	PrintFile,
	Filament,
	Tag,
	CustomField,
} from './types';

/**
 * loadOptions and listSearch wiring for the SimplyPrint action node.
 *
 * `loadOptions` feeds plain `type: 'options'` dropdowns (queue groups, tags,
 * custom fields).
 *
 * `listSearch` feeds `type: 'resourceLocator'` "From list" pickers for single-
 * entity selection (printers, files, filaments, queue items). Both flows hit
 * the same endpoints; `listSearch` wraps the result in the shape n8n expects
 * (`{ results, paginationToken }`) and supports client-side filtering.
 */

function matches(filter: string | undefined, text: string): boolean {
	if (!filter) return true;
	return text.toLowerCase().includes(filter.toLowerCase());
}

export async function loadPrinters(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: Printer[] }>(this, {
		method: 'GET',
		path: 'printers/Get',
	});
	const printers = res.objects?.data ?? [];
	return printers.map((p) => ({
		name: p.name + (p.model ? ` (${p.model})` : ''),
		value: p.id,
	}));
}

export async function searchPrinters(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ data?: Printer[] }>(this, {
		method: 'GET',
		path: 'printers/Get',
	});
	const printers = res.objects?.data ?? [];
	const results: INodeListSearchItems[] = printers
		.map((p) => ({
			name: p.name + (p.model ? ` (${p.model})` : ''),
			value: p.id,
		}))
		.filter((r) => matches(filter, r.name));
	return { results };
}

export async function loadQueueGroups(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: QueueGroup[] }>(this, {
		method: 'GET',
		path: 'queue/GetQueueGroups',
	});
	const groups = res.objects?.data ?? [];
	return groups.map((g) => ({ name: g.name, value: g.id }));
}

export async function loadFiles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: PrintFile[] }>(this, {
		method: 'GET',
		path: 'files/Get',
	});
	const files = res.objects?.data ?? [];
	return files.map((f) => ({ name: f.name, value: f.id }));
}

export async function searchFiles(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ data?: PrintFile[] }>(this, {
		method: 'GET',
		path: 'files/Get',
	});
	const files = res.objects?.data ?? [];
	const results: INodeListSearchItems[] = files
		.map((f) => ({ name: f.name, value: f.id }))
		.filter((r) => matches(filter, r.name));
	return { results };
}

export async function loadQueueItems(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: QueueItem[] }>(this, {
		method: 'GET',
		path: 'queue/Get',
	});
	const items = res.objects?.data ?? [];
	return items.map((i) => ({
		name: i.file_name ?? `Queue item #${i.id}`,
		value: i.id,
	}));
}

export async function searchQueueItems(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ data?: QueueItem[] }>(this, {
		method: 'GET',
		path: 'queue/Get',
	});
	const items = res.objects?.data ?? [];
	const results: INodeListSearchItems[] = items
		.map((i) => ({
			name: i.file_name ?? `Queue item #${i.id}`,
			value: i.id,
		}))
		.filter((r) => matches(filter, r.name));
	return { results };
}

export async function loadFilaments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: Filament[] }>(this, {
		method: 'GET',
		path: 'filament/Get',
	});
	const filaments = res.objects?.data ?? [];
	return filaments.map((f) => ({
		name: [f.brand, f.material, f.name].filter(Boolean).join(' ') || `Filament #${f.id}`,
		value: f.id,
	}));
}

export async function searchFilaments(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const res = await simplyprintCall<{ data?: Filament[] }>(this, {
		method: 'GET',
		path: 'filament/Get',
	});
	const filaments = res.objects?.data ?? [];
	const results: INodeListSearchItems[] = filaments
		.map((f) => ({
			name: [f.brand, f.material, f.name].filter(Boolean).join(' ') || `Filament #${f.id}`,
			value: f.id,
		}))
		.filter((r) => matches(filter, r.name));
	return { results };
}

export async function loadTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const res = await simplyprintCall<{ data?: Tag[] }>(this, {
		method: 'GET',
		path: 'tags/Get',
	});
	const tags = res.objects?.data ?? [];
	return tags.map((t) => ({ name: t.name, value: t.id }));
}

export async function loadCustomFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	// custom_fields/Get has oauth_disabled=true server-side, so OAuth callers
	// get a 403. Degrade silently so the UI doesn't explode: returning [] is
	// enough for n8n to render "no options" without breaking the node.
	try {
		const res = await simplyprintCall<{ data?: CustomField[] }>(this, {
			method: 'GET',
			path: 'custom_fields/Get',
		});
		const fields = res.objects?.data ?? [];
		return fields.map((f) => ({
			name: `${f.name} (${f.field_type})`,
			value: f.id,
		}));
	} catch {
		return [];
	}
}
