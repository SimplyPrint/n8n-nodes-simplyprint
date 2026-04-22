import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['filament'] };

export const filamentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'List', value: 'list', action: 'List filaments' },
			{ name: 'Get', value: 'get', action: 'Get a filament' },
			{ name: 'Assign', value: 'assign', action: 'Assign a filament to a printer' },
			{ name: 'Unassign', value: 'unassign', action: 'Unassign a filament from a printer' },
		],
		default: 'list',
	},
];

export const filamentFields: INodeProperties[] = [
	{
		displayName: 'Filament',
		name: 'filamentId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadFilaments' },
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['filament'], operation: ['get', 'assign', 'unassign'] } },
	},
	{
		displayName: 'Printer',
		name: 'printerId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadPrinters' },
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['filament'], operation: ['assign', 'unassign'] } },
	},
];
