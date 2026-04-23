import type { INodeProperties } from 'n8n-workflow';

import { customFieldFixedCollection } from '../common/customFields';

const show = { resource: ['customField'] };

export const customFieldOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'List', value: 'list', action: 'List custom field definitions' },
			{
				name: 'Submit Values',
				value: 'setValues',
				action: 'Submit custom field values for one or more entities',
				description: 'Writes one or more custom-field values to a list of entities (queue items, files, print jobs, ...)',
			},
		],
		default: 'list',
	},
];

export const customFieldFields: INodeProperties[] = [
	{
		displayName: 'Category',
		name: 'category',
		type: 'options',
		default: 'print',
		required: true,
		description: 'Entity category the custom field belongs to',
		options: [
			{ name: 'Filament', value: 'filament' },
			{ name: 'Print (Queue / Job / File)', value: 'print' },
			{ name: 'Printer', value: 'printer' },
			{ name: 'User', value: 'user' },
			{ name: 'User File', value: 'user_file' },
		],
		displayOptions: { show: { resource: ['customField'], operation: ['setValues'] } },
	},
	{
		displayName: 'Sub-Category',
		name: 'subCategory',
		type: 'options',
		default: '',
		description: 'Only applies to the "print" category. Pick which print-related entity to target.',
		options: [
			{ name: 'None (Use for Non-Print Categories)', value: '' },
			{ name: 'Print Job', value: 'print_job' },
			{ name: 'Print Queue Item', value: 'print_queue' },
			{ name: 'User File', value: 'user_file' },
		],
		displayOptions: { show: { resource: ['customField'], operation: ['setValues'], category: ['print'] } },
	},
	{
		displayName: 'Entity IDs',
		name: 'entityIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '123,456',
		description: 'Comma-separated IDs of the entities to update',
		displayOptions: { show: { resource: ['customField'], operation: ['setValues'] } },
	},
	customFieldFixedCollection(
		'Values',
		'One row per field to set. Each row carries a field UUID, a type hint, and the value.',
		{ show: { resource: ['customField'], operation: ['setValues'] } },
	),
];
