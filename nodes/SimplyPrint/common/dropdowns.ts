import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

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
 * loadOptions methods wired to the Action node under `methods.loadOptions`.
 * Each one returns the list of INodePropertyOptions the n8n UI displays in
 * a dropdown when the user picks "From list" on a property.
 *
 * Mirrors activepieces/piece/src/lib/common/props.ts.
 */

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
	const res = await simplyprintCall<{ data?: CustomField[] }>(this, {
		method: 'GET',
		path: 'custom_fields/Get',
	});
	const fields = res.objects?.data ?? [];
	return fields.map((f) => ({
		name: `${f.name} (${f.field_type})`,
		value: f.id,
	}));
}
