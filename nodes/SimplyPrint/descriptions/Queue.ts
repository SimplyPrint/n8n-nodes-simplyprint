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
			{ name: 'Add File to Queue', value: 'addItem', action: 'Add a file to the queue' },
			{ name: 'Approve Item', value: 'approveItem', action: 'Approve a queue item' },
			{ name: 'Deny Item', value: 'denyItem', action: 'Deny a queue item' },
			{ name: 'Empty Queue', value: 'empty', action: 'Empty the queue or a queue group' },
			{ name: 'List Groups', value: 'listGroups', action: 'List queue groups' },
			{ name: 'List Items', value: 'listItems', action: 'List queue items' },
			{ name: 'List Pending Approval', value: 'listPending', action: 'List items awaiting approval' },
			{ name: 'Move Item', value: 'moveItem', action: 'Move a queue item to a new position' },
			{ name: 'Remove Item', value: 'removeItem', action: 'Remove a queue item' },
			{ name: 'Revive Item', value: 'reviveItem', action: 'Bring a done item back into the active queue' },
			{ name: 'Update Item', value: 'updateItem', action: 'Update a queue item' },
		],
		default: 'listItems',
	},
];

export const queueFields: INodeProperties[] = [
	// list / empty filters
	{
		displayName: 'Queue Group Name or ID',
		name: 'groupId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadQueueGroups' },
		default: 0,
		description: 'Leave blank for the default group. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['queue'], operation: ['listItems', 'addItem', 'empty'] } },
	},
	{
		displayName: 'Include Done',
		name: 'includeDone',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['queue'], operation: ['listItems', 'empty'] } },
	},
	// addItem
	{
		displayName: 'File Name or ID',
		name: 'fileId',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
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
	// updateItem / moveItem / removeItem / reviveItem
	{
		displayName: 'Queue Item Name or ID',
		name: 'queueItemId',
		type: 'options',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: { loadOptionsMethod: 'loadQueueItems' },
		required: true,
		default: 0,
		displayOptions: {
			show: {
				resource: ['queue'],
				operation: ['updateItem', 'moveItem', 'removeItem', 'reviveItem'],
			},
		},
	},
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		default: '',
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
	// approve / deny
	{
		displayName: 'Queue Item IDs',
		name: 'queueItemIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '123,456,789',
		description: 'Comma-separated queue item IDs to approve or deny',
		displayOptions: { show: { resource: ['queue'], operation: ['approveItem', 'denyItem'] } },
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['queue'], operation: ['approveItem', 'denyItem'] } },
	},
	// addItem custom fields
	customFieldFixedCollection(
		'Custom Fields',
		'PRINT_QUEUE custom-field values to attach to the new queue item. Category is inferred server-side.',
		{ show: { resource: ['queue'], operation: ['addItem'] } },
	),
];
