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
			{
				name: 'Assign',
				value: 'assign',
				action: 'Assign a filament to a printer',
				description: 'Assign a filament spool to a printer',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a filament',
				description: 'Retrieve a filament',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many filaments',
				description: 'Retrieve a list of filaments',
			},
			{
				name: 'Unassign',
				value: 'unassign',
				action: 'Unassign a filament from a printer',
				description: 'Remove a filament spool from a printer',
			},
		],
		default: 'getAll',
	},
];

export const filamentFields: INodeProperties[] = [
	{
		displayName: 'Filament',
		name: 'filamentId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Filament to target',
		displayOptions: { show: { resource: ['filament'], operation: ['get', 'assign', 'unassign'] } },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a filament...',
				typeOptions: {
					searchListMethod: 'searchFilaments',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 17',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[1-9][0-9]*$',
							errorMessage: 'Filament ID must be a positive integer',
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Printer',
		name: 'printerId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Printer to assign the filament to',
		displayOptions: { show: { resource: ['filament'], operation: ['assign'] } },
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
		displayName: 'Nozzle',
		name: 'nozzle',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description:
			'Zero-based nozzle index on the printer. Single-nozzle printers leave this at 0; multi-nozzle setups (e.g. IDEX, H2D) use 1+ for the secondary nozzle.',
		displayOptions: { show: { resource: ['filament'], operation: ['assign'] } },
	},
	{
		displayName: 'Extruder',
		name: 'extruder',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description:
			'Zero-based extruder index on the chosen nozzle. Direct-drive printers leave this at 0; AMS / multi-material setups use 1, 2, 3 for the additional lanes.',
		displayOptions: { show: { resource: ['filament'], operation: ['assign'] } },
	},
];
