import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'] };

/**
 * File operations surfaced via OAuth2 / API-key.
 *
 * Intentionally NOT included:
 *   - `File > Get` (single-file fetch): no OAuth-reachable endpoint exists —
 *     `files/GetFiles` with a `search` filter is the way to look a single
 *     file up, and that's exposed via Get Many.
 *   - `File > Delete`: `files/DeleteFile` has `oauth_disabled = true`
 *     server-side, so OAuth callers always get 403.
 *   - `File > Upload and Queue` composite: split into three separate steps
 *     that the user chains (Upload -> Queue > Add Item -> Print Job > Create).
 *     The composite hid the fact that each step has its own error surface
 *     and distinct input shape; separate ops make the failure modes visible
 *     in the flow builder.
 *
 * The file identifier on the wire is the hex string `uid`, not a numeric id.
 * `File > Upload` returns that UID on the `fileId` field of its output,
 * ready to be piped into `Queue > Add Item` (which accepts it via the
 * `File UID` resourceLocator).
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
				description: 'Upload a binary file to SimplyPrint. Returns `fileId` (hex UID) ready to pipe into Queue > Add Item or Print Job > Create.',
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
		description:
			'Folder to list files from. -1 = all files (flat, recursive). 0 = account root. A positive integer = a specific folder ID',
		displayOptions: { show: { resource: ['file'], operation: ['getAll'] } },
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
		description:
			'Comma-separated file UIDs (hex strings) to move. Use Get Many with a search term to look UIDs up.',
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
	// upload
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		placeholder: 'e.g. data',
		description: 'Name of the binary input on the incoming item that holds the file to upload',
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
	},
];
