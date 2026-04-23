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
			{
				name: 'Get Current User',
				value: 'getCurrentUser',
				action: 'Get the user and account bound to this connection',
				description: 'Retrieve the user and account bound to this connection',
			},
			{
				name: 'Get Many Print History',
				value: 'getAllPrintHistory',
				action: 'Get many completed and failed print jobs',
				description: 'Retrieve a list of completed and failed print jobs',
			},
			{
				name: 'Get Many Tags',
				value: 'getAllTags',
				action: 'Get many tags on the account',
				description: 'Retrieve a list of tags on the account',
			},
			{
				name: 'Get Statistics',
				value: 'getStatistics',
				action: 'Get account wide print statistics',
				description: 'Retrieve account-wide print statistics',
			},
		],
		default: 'getCurrentUser',
	},
];

export const organizationFields: INodeProperties[] = [];
