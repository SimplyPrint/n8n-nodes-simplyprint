import type { INodeProperties } from 'n8n-workflow';

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
			{ name: 'Set Values', value: 'setValues', action: 'Set a custom field value across items' },
		],
		default: 'list',
	},
];

export const customFieldFields: INodeProperties[] = [
	{
		displayName: 'Custom Field Name or ID',
		name: 'customFieldId',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: { loadOptionsMethod: 'loadCustomFields' },
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['customField'], operation: ['setValues'] } },
	},
	{
		displayName: 'Entity',
		name: 'entity',
		type: 'options',
		options: [
			{ name: 'Print Job', value: 'print' },
			{ name: 'Queue Item', value: 'queue_item' },
			{ name: 'File', value: 'file' },
			{ name: 'Printer', value: 'printer' },
		],
		default: 'print',
		required: true,
		displayOptions: { show: { resource: ['customField'], operation: ['setValues'] } },
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
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		default: '',
		description: 'New value to store for this field on every listed entity',
		displayOptions: { show: { resource: ['customField'], operation: ['setValues'] } },
	},
];
