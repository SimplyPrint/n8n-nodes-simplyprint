import type { INodeProperties } from 'n8n-workflow';

import { customFieldFixedCollection } from '../common/customFields';
import { buildStartOptionsField } from '../common/startOptions';

const show = { resource: ['printJob'] };

export const printJobOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Start a print on one or more printers',
				description: 'Wraps printers/actions/CreateJob. File source can be an uploaded user file or a queue item.',
			},
		],
		default: 'create',
	},
];

export const printJobFields: INodeProperties[] = [
	{
		displayName: 'Printer IDs',
		name: 'printerIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 42,77',
		description: 'Comma-separated printer IDs. Use the Printer resource to look IDs up.',
		displayOptions: { show: { resource: ['printJob'], operation: ['create'] } },
	},
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		default: 'userFile',
		description: 'Where the gcode comes from',
		options: [
			{ name: 'Queue Item', value: 'queueItem' },
			{ name: 'User File', value: 'userFile' },
		],
		displayOptions: { show: { resource: ['printJob'], operation: ['create'] } },
	},
	{
		displayName: 'File',
		name: 'fileId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Uploaded user file to print',
		displayOptions: {
			show: { resource: ['printJob'], operation: ['create'], fileSource: ['userFile'] },
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a file...',
				typeOptions: {
					searchListMethod: 'searchFiles',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 9128',
			},
		],
	},
	{
		displayName: 'Queue Item',
		name: 'queueItemId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Queue item to print',
		displayOptions: {
			show: { resource: ['printJob'], operation: ['create'], fileSource: ['queueItem'] },
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a queue item...',
				typeOptions: {
					searchListMethod: 'searchQueueItems',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 8821',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[1-9][0-9]*$',
							errorMessage: 'Queue item ID must be a positive integer',
						},
					},
				],
			},
		],
	},
	customFieldFixedCollection(
		'Shared Custom Fields',
		'PRINT_JOB custom-field values applied to every printer in this call. Category is inferred server-side',
		{ show: { resource: ['printJob'], operation: ['create'] } },
	),
	{
		displayName: 'Individual Custom Fields (JSON)',
		name: 'individualCustomFields',
		type: 'json',
		default: '[]',
		description:
			'Optional per-printer overrides. Each entry carries an ID (the target printer) and a value array of custom-field submissions. See the README for the exact shape',
		displayOptions: { show: { resource: ['printJob'], operation: ['create'] } },
	},
	buildStartOptionsField({ show: { resource: ['printJob'], operation: ['create'] } }),
	{
		displayName: 'MMS Map (JSON)',
		name: 'mmsMap',
		type: 'json',
		default: '{}',
		description: 'Optional multi-material slot mapping. Free-form object passed through to the backend as mms_map.',
		displayOptions: { show: { resource: ['printJob'], operation: ['create'] } },
	},
];
