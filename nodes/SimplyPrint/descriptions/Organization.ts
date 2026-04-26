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

export const organizationFields: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'string',
		default: '',
		placeholder: 'e.g. 1714521600',
		description:
			'Optional start of the reporting window, as a Unix epoch timestamp (seconds). Leave blank to use the account default ("general" stats covering the last week).',
		displayOptions: { show: { resource: ['organization'], operation: ['getStatistics'] } },
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'string',
		default: '',
		placeholder: 'e.g. 1717113600',
		description:
			'Optional end of the reporting window, as a Unix epoch timestamp (seconds). Required when Start Date is set.',
		displayOptions: { show: { resource: ['organization'], operation: ['getStatistics'] } },
	},
];
