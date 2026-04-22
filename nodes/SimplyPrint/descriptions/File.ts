import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'] };

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'List', value: 'list', action: 'List files' },
			{ name: 'Get', value: 'get', action: 'Get a file' },
			{ name: 'Upload', value: 'upload', action: 'Upload a file' },
			{ name: 'Move', value: 'move', action: 'Move a file to another folder' },
			{ name: 'Delete', value: 'delete', action: 'Delete a file' },
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
		displayOptions: { show: { resource: ['file'], operation: ['list', 'upload', 'move'] } },
	},
	{
		displayName: 'File',
		name: 'fileId',
		type: 'options',
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
		displayOptions: { show: { resource: ['file'], operation: ['upload'] } },
	},
];
