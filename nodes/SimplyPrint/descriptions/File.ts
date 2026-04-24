import type { INodeProperties } from 'n8n-workflow';

import { buildStartOptionsField } from '../common/startOptions';

const show = { resource: ['file'] };

/**
 * File operations surfaced via OAuth2 / API-key.
 *
 * Intentionally NOT included:
 *   - `File > Get` (single-file fetch): no OAuth-reachable endpoint exists —
 *     `files/GetFiles` with a `search` filter is the way to look a single
 *     file up, and that's exposed via Get Many.
 *   - `File > Delete`: `files/DeleteFile` has `oauth_disabled = true`
 *     server-side, so OAuth callers always get 403. Omitted rather than
 *     shipped as a broken operation.
 *
 * The file identifier on the wire is the hex string `uid`, not a numeric id.
 * The Move operation passes it via the `files` CSV query param on a GET to
 * `files/MoveFiles`.
 */
export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many files',
				description: 'Retrieve a list of files (optionally filtered by folder or search term)',
			},
			{
				name: 'Move',
				value: 'move',
				action: 'Move files to another folder',
				description: 'Move one or more files to another folder',
			},
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a file',
				description: 'Upload a binary file to SimplyPrint',
			},
			{
				name: 'Upload and Queue',
				value: 'uploadAndQueue',
				action: 'Upload a file and add it to the queue',
				description: 'Upload a file, add it to the queue, and optionally start a print',
			},
		],
		default: 'getAll',
	},
];

export const fileFields: INodeProperties[] = [
	// getAll: optional folder filter + search
	{
		displayName: 'Folder ID',
		name: 'folderId',
		type: 'number',
		default: -1,
		placeholder: 'e.g. 31',
		description: 'Folder to list files from. -1 = all files (flat, recursive). 0 = account root. A positive integer = a specific folder ID',
		displayOptions: {
			show: { resource: ['file'], operation: ['getAll', 'upload', 'uploadAndQueue'] },
		},
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		placeholder: 'e.g. bracket',
		description: 'Optional substring to match against file names',
		displayOptions: { show: { resource: ['file'], operation: ['getAll'] } },
	},
	// move: source uids + target folder
	{
		displayName: 'File UIDs',
		name: 'fileUids',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. c677ebfd2de41c58eec387e3c84e7895,96b2fc6c4aaedfbe37e62b2faafb2bf6',
		description: 'Comma-separated file UIDs (hex strings) to move. Use Get Many with a search term to look UIDs up.',
		displayOptions: { show: { resource: ['file'], operation: ['move'] } },
	},
	{
		displayName: 'Target Folder ID',
		name: 'targetFolderId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 31',
		description: 'Destination folder ID. 0 = account root.',
		displayOptions: { show: { resource: ['file'], operation: ['move'] } },
	},
	// upload + uploadAndQueue
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		placeholder: 'e.g. data',
		description: 'Name of the binary input on the incoming item that holds the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['upload', 'uploadAndQueue'] } },
	},
	{
		displayName: 'Queue Group Name or ID',
		name: 'queueGroupId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'loadQueueGroups' },
		default: 0,
		required: true,
		description:
			'Queue group to add the upload to. Required if the account has queue groups configured. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		description:
			'PRINT_QUEUE custom-field values to attach to the queue item. Category is inferred server-side.',
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
						placeholder: 'e.g. 7b2c4e3a-9f17-4a23-8c64-9f9e2b1cdfe4',
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
		placeholder: 'e.g. 42,77',
		description:
			'Comma-separated printer IDs. When set, a print is started on each listed printer right after queuing.',
		displayOptions: { show: { resource: ['file'], operation: ['uploadAndQueue'] } },
	},
	{
		displayName: 'Print Job Custom Fields',
		name: 'printCustomFields',
		type: 'fixedCollection',
		placeholder: 'Add print job custom field value',
		typeOptions: { multipleValues: true },
		default: {},
		description:
			'PRINT_JOB custom-field values applied to the started print job(s). Ignored when no printers are selected.',
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
						placeholder: 'e.g. 7b2c4e3a-9f17-4a23-8c64-9f9e2b1cdfe4',
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
