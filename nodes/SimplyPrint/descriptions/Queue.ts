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
			'Leave blank for the default group. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		displayName: 'File Name or ID',
		name: 'fileId',
		type: 'options',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: { loadOptionsMethod: 'loadFiles' },
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['queue'], operation: ['addItem'] } },
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
	customFieldFixedCollection(
		'Custom Fields',
		'PRINT_QUEUE custom-field values to attach to the new queue item. Category is inferred server-side',
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
