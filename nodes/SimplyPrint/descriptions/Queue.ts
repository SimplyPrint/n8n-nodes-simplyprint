import type { INodeProperties } from 'n8n-workflow';

import { customFieldFixedCollection } from '../common/customFields';

const show = { resource: ['queue'] };

export const queueOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Add Item',
				value: 'addItem',
				action: 'Add an item to the queue',
				description: 'Add a file to the print queue',
			},
			{
				name: 'Approve Item',
				value: 'approveItem',
				action: 'Approve a queue item',
				description: 'Approve a pending queue item',
			},
			{
				name: 'Deny Item',
				value: 'denyItem',
				action: 'Deny a queue item',
				description: 'Reject a pending queue item',
			},
			{
				name: 'Empty',
				value: 'empty',
				action: 'Empty the queue',
				description: 'Delete all items in the queue or a queue group',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many queue items',
				description: 'Retrieve a list of queue items',
			},
			{
				name: 'Get Many Groups',
				value: 'getAllGroups',
				action: 'Get many queue groups',
				description: 'Retrieve a list of queue groups',
			},
			{
				name: 'Get Many Pending',
				value: 'getAllPending',
				action: 'Get many items awaiting approval',
				description: 'Retrieve a list of items awaiting approval',
			},
			{
				name: 'Move Item',
				value: 'moveItem',
				action: 'Move a queue item',
				description: 'Move a queue item to a new position',
			},
			{
				name: 'Remove Item',
				value: 'removeItem',
				action: 'Remove a queue item',
				description: 'Remove an item from the queue',
			},
			{
				name: 'Revive Item',
				value: 'reviveItem',
				action: 'Revive a queue item',
				description: 'Bring a done item back into the active queue',
			},
			{
				name: 'Update Item',
				value: 'updateItem',
				action: 'Update a queue item',
				description: 'Update the fields on a queue item',
			},
		],
		default: 'getAll',
	},
];

export const queueFields: INodeProperties[] = [
	{
		displayName: 'Queue Group Name or ID',
		name: 'groupId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadQueueGroups' },
		default: 0,
		description:
			'Leave blank for the default group. Required only if the account has queue groups configured. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['queue'], operation: ['getAll', 'addItem', 'empty'] } },
	},
	{
		displayName: 'Include Done',
		name: 'includeDone',
		type: 'boolean',
		default: false,
		description: 'Whether to include done items in the response',
		displayOptions: { show: { resource: ['queue'], operation: ['getAll', 'empty'] } },
	},
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		default: 'userFile',
		description:
			'Where the file comes from. Pick "User File" to queue an already-uploaded library file. Pick "Upload Hash" to pass the hex ID returned by `File > Upload`',
		options: [
			{ name: 'Upload Hash (From File > Upload)', value: 'uploadHash' },
			{ name: 'User File', value: 'userFile' },
		],
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
	},
	{
		displayName: 'File',
		name: 'fileId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'User file (from your SimplyPrint library) to add to the queue',
		displayOptions: {
			show: { resource: ['queue'], operation: ['addItem'], fileSource: ['userFile'] },
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a file...',
				typeOptions: { searchListMethod: 'searchFiles', searchable: true },
			},
			{
				displayName: 'By UID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. c677ebfd2de41c58eec387e3c84e7895',
				hint: 'Hex string UID (see File > Get Many)',
			},
		],
	},
	{
		displayName: 'Upload Hash',
		name: 'uploadFileId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. c677ebfd2de41c58eec387e3c84e7895',
		description:
			'Hex ID returned by `File > Upload` on its `fileId` field. Use this when piping a fresh upload straight into the queue.',
		displayOptions: {
			show: { resource: ['queue'], operation: ['addItem'], fileSource: ['uploadHash'] },
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['queue'], operation: ['addItem', 'updateItem'] } },
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
		description: 'Where in the queue to place the item. Use Custom API Call to target a specific 1-based index.',
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
	},
	{
		displayName: 'Target Printer IDs',
		name: 'forPrinters',
		type: 'string',
		default: '',
		placeholder: 'e.g. 42,77',
		description: 'Comma-separated printer IDs the item may print on. Empty = any compatible printer.',
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
	},
	{
		displayName: 'Target Printer Model IDs',
		name: 'forModels',
		type: 'string',
		default: '',
		placeholder: 'e.g. 3,11',
		description: 'Comma-separated printer-model IDs the item may print on. Used instead of (or alongside) specific printer IDs.',
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
	},
	{
		displayName: 'Target Printer Group IDs',
		name: 'forGroups',
		type: 'string',
		default: '',
		placeholder: 'e.g. 2,5',
		description: 'Comma-separated printer-group IDs the item may print on',
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
	},
	{
		displayName: 'Tag IDs',
		name: 'tagIds',
		type: 'string',
		default: '',
		placeholder: 'e.g. 1,4,9',
		description: 'Comma-separated tag IDs to apply to the queue item. Use Organization > Get Many Tags to look IDs up.',
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
	},
	{
		displayName: 'Queue Item',
		name: 'queueItemId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Queue item to act on',
		displayOptions: {
			show: {
				resource: ['queue'],
				operation: ['updateItem', 'moveItem', 'removeItem', 'reviveItem'],
			},
		},
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a queue item...',
				typeOptions: { searchListMethod: 'searchQueueItems', searchable: true },
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
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		default: '',
		placeholder: 'e.g. Needs tree supports',
		description: 'Free-form note to attach to the queue item',
		displayOptions: { show: { resource: ['queue'], operation: ['updateItem'] } },
	},
	{
		displayName: 'New Position',
		name: 'toPosition',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: { minValue: 0 },
		description: 'Zero-based index to move the item to',
		displayOptions: { show: { resource: ['queue'], operation: ['moveItem'] } },
	},
	{
		displayName: 'Queue Item IDs',
		name: 'queueItemIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123,456,789',
		description: 'Comma-separated queue item IDs to approve or deny',
		displayOptions: { show: { resource: ['queue'], operation: ['approveItem', 'denyItem'] } },
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		default: '',
		placeholder: 'e.g. Missing slicer profile',
		description: 'Optional comment to attach to the approval or denial',
		displayOptions: { show: { resource: ['queue'], operation: ['approveItem', 'denyItem'] } },
	},
	{
		displayName: 'Request Revision',
		name: 'requestRevision',
		type: 'boolean',
		default: false,
		description:
			'Whether to keep the item in DENIED state so the submitter can revise. When off (default), the item is removed from the queue.',
		displayOptions: { show: { resource: ['queue'], operation: ['denyItem'] } },
	},
	customFieldFixedCollection(
		'Custom Fields',
		'PRINT_QUEUE custom-field values to attach to the new queue item. Category is inferred server-side.',
		{ show: { resource: ['queue'], operation: ['addItem'] } },
	),
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description:
			'Whether to return a simplified version of the response instead of the raw data',
		displayOptions: {
			show: { resource: ['queue'], operation: ['getAll', 'getAllGroups', 'getAllPending'] },
		},
	},
];
