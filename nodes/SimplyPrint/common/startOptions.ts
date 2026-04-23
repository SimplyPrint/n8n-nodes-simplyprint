import type { IDataObject, INodeProperties } from 'n8n-workflow';

/**
 * Build the "Start Options" JSON field shared by PrintJob.create and
 * File.uploadAndQueue. SimplyPrint accepts an optional object that overrides
 * slicer-derived values (nozzle, filament_material, print_speed, etc.) when
 * spinning up a print. Free-form because the accepted keys change with
 * printer firmware; users paste whatever the panel uses.
 */
export function buildStartOptionsField(
	displayOptions: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName: 'Start Options (JSON)',
		name: 'startOptions',
		type: 'json',
		default: '{}',
		description: 'Optional JSON object passed to SimplyPrint as start_options. Example: {"nozzle":"0.4","filament_material":"PLA","print_speed":100}.',
		displayOptions,
	};
}

/**
 * Parse the raw Start Options parameter. Returns a JSON string (backend
 * expects the value JSON-stringified when sent as form data) or `undefined`
 * when the object is empty/unusable so the caller can omit the field.
 */
export function normalizeStartOptions(raw: IDataObject | string | undefined): string | undefined {
	if (raw === undefined || raw === null || raw === '') return undefined;
	let obj: IDataObject;
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
			obj = parsed as IDataObject;
		} catch {
			return undefined;
		}
	} else {
		obj = raw;
	}
	if (Object.keys(obj).length === 0) return undefined;
	return JSON.stringify(obj);
}
