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
			{
				name: 'Cancel Print',
				value: 'cancel',
				action: 'Cancel the print on a printer',
				description: 'Cancel the in-progress print on a printer',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a printer',
				description: 'Retrieve a printer',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many printers',
				description: 'Retrieve a list of printers',
			},
			{
				name: 'Pause Print',
				value: 'pause',
				action: 'Pause the print on a printer',
				description: 'Pause the in-progress print on a printer',
			},
			{
				name: 'Resume Print',
				value: 'resume',
				action: 'Resume the print on a printer',
				description: 'Resume a paused print on a printer',
			},
			{
				name: 'Send G-Code',
				value: 'sendGcode',
				action: 'Send raw gcode lines to a printer',
				description: 'Send raw gcode lines to a printer',
			},
		],
		default: 'getAll',
	},
];

export const printerFields: INodeProperties[] = [
	{
		displayName: 'Printer',
		name: 'printerId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Printer to target',
		displayOptions: {
			show: { resource: ['printer'], operation: ['get', 'pause', 'resume', 'cancel', 'sendGcode'] },
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a printer...',
				typeOptions: {
					searchListMethod: 'searchPrinters',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 42',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[1-9][0-9]*$',
							errorMessage: 'Printer ID must be a positive integer',
						},
					},
				],
			},
		],
	},
	{
		displayName: 'G-Code Lines',
		name: 'gcode',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		required: true,
		placeholder: 'e.g. G28\nM104 S210\nG1 X100 Y100 F3000',
		description: 'One G-code command per line. The first line runs first. Max 200 lines',
		displayOptions: { show: { resource: ['printer'], operation: ['sendGcode'] } },
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description:
			'Whether to return a simplified version of the response instead of the raw data',
		displayOptions: { show: { resource: ['printer'], operation: ['getAll', 'get'] } },
	},
];
