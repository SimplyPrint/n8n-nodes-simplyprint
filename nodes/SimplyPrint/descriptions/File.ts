import type { INodeProperties } from 'n8n-workflow';

import { buildStartOptionsField } from '../common/startOptions';

const show = { resource: ['file'] };

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Delete', value: 'delete', action: 'Delete a file' },
			{ name: 'Get', value: 'get', action: 'Get a file' },
			{ name: 'List', value: 'list', action: 'List files' },
			{ name: 'Move', value: 'move', action: 'Move a file to another folder' },
			{ name: 'Upload', value: 'upload', action: 'Upload a file' },
			{
				name: 'Upload and Queue',
				value: 'uploadAndQueue',
				action: 'Upload a file and add it to the queue',
				description: 'Composite: uploads a file, adds it to the queue, and optionally starts a print',
			},
		],
		default: 'list',
	},
];

export const fileFields: INodeProperties[] = [
	{
		displayName: 'Folder ID',
		name: 'folderId',
		type: 'number',
		default: 0,
		description: 'Zero (or blank) lists the account root',
		displayOptions: {
			show: { resource: ['file'], operation: ['list', 'upload', 'uploadAndQueue', 'move'] },
		},
	},
	{
		displayName: 'File Name or ID',
		name: 'fileId',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: { loadOptionsMethod: 'loadFiles' },
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['file'], operation: ['get', 'move', 'delete'] } },
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary input on the incoming item that holds the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['upload', 'uploadAndQueue'] } },
	},
	// uploadAndQueue only — queue group id for the print queue step.
	// (file.upload targets files.simplyprint.io which does not need a group.)
	{
		displayName: 'Queue Group Name or ID',
		name: 'queueGroupId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadQueueGroups' },
		default: 0,
		required: true,
		description: 'Required. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
	},
	{
		displayName: 'Position',
		name: 'position',
		type: 'options',
		options: [
			{ name: 'Bottom', value: 'bottom' },
			{ name: 'Top', value: 'top' },
		],
		default: 'bottom',
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
	},
	{
		displayName: 'Queue Item Custom Fields',
		name: 'queueCustomFields',
		type: 'fixedCollection',
		placeholder: 'Add queue item custom field value',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'PRINT_QUEUE custom-field values to attach to the queue item. Category is inferred server-side.',
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
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
						description: 'Field UUID (the string fieldId, not the numeric ID)',
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
						description: 'Value to submit. See the main Custom Fields description for type coercion rules.',
					},
				],
			},
		],
	},
	{
		displayName: 'Start On Printer IDs',
		name: 'startOnPrinterIds',
		type: 'string',
		default: '',
		placeholder: '42,77',
		description: 'Optional. Comma-separated printer IDs. When set, a print is started on each listed printer right after queuing.',
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
	},
	{
		displayName: 'Print Job Custom Fields',
		name: 'printCustomFields',
		type: 'fixedCollection',
		placeholder: 'Add print job custom field value',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'PRINT_JOB custom-field values applied to the started print job(s). Ignored when no printers are selected.',
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
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
						description: 'Field UUID (the string fieldId, not the numeric ID)',
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
						description: 'Value to submit. See the main Custom Fields description for type coercion rules.',
					},
				],
			},
		],
	},
	buildStartOptionsField({ show: { resource: ['file'], operation: ['uploadAndQueue'] } }),
];
