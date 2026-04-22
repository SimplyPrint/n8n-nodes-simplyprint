import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['organization'] };

export const organizationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Get Current User', value: 'getCurrentUser', action: 'Get the user and company bound to this connection' },
			{ name: 'Get Statistics', value: 'getStatistics', action: 'Get account wide print statistics' },
			{ name: 'List Print History', value: 'listPrintHistory', action: 'List completed and failed print jobs' },
			{ name: 'List Tags', value: 'listTags', action: 'List tags on the account' },
		],
		default: 'getCurrentUser',
	},
];

export const organizationFields: INodeProperties[] = [];
