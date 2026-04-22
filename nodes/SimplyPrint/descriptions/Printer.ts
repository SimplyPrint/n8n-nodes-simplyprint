import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['printer'] };

export const printerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'List', value: 'list', action: 'List printers', description: 'Get all printers on the account' },
			{ name: 'Get', value: 'get', action: 'Get a printer', description: 'Fetch a single printer by ID' },
			{ name: 'Pause Print', value: 'pause', action: 'Pause the print on a printer' },
			{ name: 'Resume Print', value: 'resume', action: 'Resume the print on a printer' },
			{ name: 'Cancel Print', value: 'cancel', action: 'Cancel the print on a printer' },
			{ name: 'Send G-Code', value: 'sendGcode', action: 'Send raw G-code lines to a printer' },
		],
		default: 'list',
	},
];

export const printerFields: INodeProperties[] = [
	{
		displayName: 'Printer',
		name: 'printerId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadPrinters' },
		required: true,
		default: 0,
		description: 'The printer to target. Pick from list or supply an expression that resolves to the numeric ID.',
		displayOptions: { show: { resource: ['printer'], operation: ['get', 'pause', 'resume', 'cancel', 'sendGcode'] } },
	},
	{
		displayName: 'G-Code Lines',
		name: 'gcode',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		required: true,
		placeholder: 'G28\nM104 S210\nG1 X100 Y100 F3000',
		description: 'One G-code command per line. The first line runs first. Max 200 lines.',
		displayOptions: { show: { resource: ['printer'], operation: ['sendGcode'] } },
	},
];
