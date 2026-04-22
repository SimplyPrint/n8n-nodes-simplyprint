import type { INodeProperties } from 'n8n-workflow';

import { printerOperations, printerFields } from './Printer';
import { queueOperations, queueFields } from './Queue';
import { fileOperations, fileFields } from './File';
import { filamentOperations, filamentFields } from './Filament';
import { organizationOperations, organizationFields } from './Organization';
import { customFieldOperations, customFieldFields } from './CustomField';
import { webhookOperations, webhookFields } from './Webhook';
import { customApiCallOperations, customApiCallFields } from './CustomApiCall';

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Custom API Call', value: 'customApiCall' },
		{ name: 'Custom Field', value: 'customField' },
		{ name: 'Filament', value: 'filament' },
		{ name: 'File', value: 'file' },
		{ name: 'Organization', value: 'organization' },
		{ name: 'Printer', value: 'printer' },
		{ name: 'Queue', value: 'queue' },
		{ name: 'Webhook', value: 'webhook' },
	],
	default: 'printer',
};

export const allProperties: INodeProperties[] = [
	resourceProperty,

	...printerOperations,
	...printerFields,

	...queueOperations,
	...queueFields,

	...fileOperations,
	...fileFields,

	...filamentOperations,
	...filamentFields,

	...organizationOperations,
	...organizationFields,

	...customFieldOperations,
	...customFieldFields,

	...webhookOperations,
	...webhookFields,

	...customApiCallOperations,
	...customApiCallFields,
];
