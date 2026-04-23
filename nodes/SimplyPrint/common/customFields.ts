import type { IDataObject, INodeProperties } from 'n8n-workflow';

/**
 * Shape the SimplyPrint backend accepts for every custom-field submission
 * (validated server-side against CustomFieldValueSubmission): an array of
 * `{customFieldId, value: {string?|number?|boolean?|date?|options?[]}}`.
 */
export interface CustomFieldValueSubmission {
	customFieldId: string;
	value: {
		string?: string;
		number?: number;
		boolean?: boolean;
		date?: string;
		options?: string[];
	};
}

export type CustomFieldValueType = 'text' | 'number' | 'boolean' | 'date' | 'json';

interface FixedCollectionEntry {
	customFieldId?: unknown;
	type?: unknown;
	value?: unknown;
}

interface FixedCollectionInput {
	value?: FixedCollectionEntry[];
}

/**
 * Coerce one user-entered row (from the customFields fixedCollection) into a
 * backend-shape CustomFieldValueSubmission. Returns `null` if the row is
 * unusable (no id, or value-coercion fails for the chosen type).
 */
function coerceEntry(entry: FixedCollectionEntry): CustomFieldValueSubmission | null {
	const customFieldId = typeof entry.customFieldId === 'string' ? entry.customFieldId.trim() : '';
	if (!customFieldId) return null;

	const type = (typeof entry.type === 'string' ? entry.type : 'text') as CustomFieldValueType;
	const raw = entry.value;
	const rawStr = raw === undefined || raw === null ? '' : String(raw);

	if (type === 'number') {
		const n = Number(rawStr);
		if (!Number.isFinite(n)) return null;
		return { customFieldId, value: { number: n } };
	}
	if (type === 'boolean') {
		const truthy = ['true', '1', 'yes', 'on'].includes(rawStr.trim().toLowerCase());
		return { customFieldId, value: { boolean: truthy } };
	}
	if (type === 'date') {
		return { customFieldId, value: { date: rawStr } };
	}
	if (type === 'json') {
		try {
			const parsed = JSON.parse(rawStr) as unknown;
			if (Array.isArray(parsed)) {
				return { customFieldId, value: { options: parsed.map((o) => String(o)) } };
			}
			if (parsed && typeof parsed === 'object') {
				return { customFieldId, value: parsed as CustomFieldValueSubmission['value'] };
			}
			return null;
		} catch {
			return null;
		}
	}
	return { customFieldId, value: { string: rawStr } };
}

/**
 * Convert the `customFields` fixedCollection parameter into the array shape
 * the backend expects. Returns an empty array when nothing usable is provided.
 */
export function toSubmissionArray(
	input: FixedCollectionInput | IDataObject | undefined,
): CustomFieldValueSubmission[] {
	if (!input || typeof input !== 'object') return [];
	const rows = (input as FixedCollectionInput).value;
	if (!Array.isArray(rows)) return [];
	const out: CustomFieldValueSubmission[] = [];
	for (const row of rows) {
		const submission = coerceEntry(row);
		if (submission) out.push(submission);
	}
	return out;
}

/**
 * Reusable fixedCollection property for "add a list of custom field values".
 * Mirrors the n8n community pattern (each row = one submission).
 */
export function customFieldFixedCollection(
	displayName: string,
	description: string,
	displayOptions: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName,
		name: 'customFields',
		type: 'fixedCollection',
		placeholder: 'Add custom field value',
		typeOptions: { multipleValues: true },
		default: {},
		description,
		displayOptions,
		options: [
			{
				displayName: 'Value',
				name: 'value',
				values: [
					{
						displayName: 'Custom Field ID',
						name: 'customFieldId',
						type: 'string',
						default: '',
						required: true,
						description: 'Field UUID (the string fieldId, not the numeric ID). Use the List Custom Fields operation to look it up.',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 'text',
						description: 'How to coerce the value before sending it to SimplyPrint',
						options: [
							{ name: 'Boolean', value: 'boolean' },
							{ name: 'Date', value: 'date' },
							{ name: 'JSON', value: 'json' },
							{ name: 'Number', value: 'number' },
							{ name: 'Text', value: 'text' },
						],
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to submit. For Boolean use true/false. For Date use YYYY-MM-DD. For JSON enter an array like ["opt1","opt2"] or a {string|number|boolean|date|options} object.',
					},
				],
			},
		],
	};
}
