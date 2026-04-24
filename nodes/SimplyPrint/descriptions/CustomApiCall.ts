import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customApiCall'] };

export const customApiCallOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Custom API Call',
				value: 'call',
				// `SimplyPrint` and `API` are both proper nouns; the sentence-case
				// lint rule doesn't know that and would rewrite them to
				// "simply print api". Suppressed with a one-line justification
				// rather than renaming around the brand.
				// eslint-disable-next-line n8n-nodes-base/node-param-operation-option-action-miscased -- proper nouns ("SimplyPrint", "API") preserved
				action: 'Call any SimplyPrint API endpoint',
				description: 'Escape hatch for endpoints this node does not wrap directly. Path is relative to the company (e.g. "printers/Get").',
			},
		],
		default: 'call',
	},
];

export const customApiCallFields: INodeProperties[] = [
	{
		displayName: 'HTTP Method',
		name: 'method',
		type: 'options',
		options: [
			{ name: 'DELETE', value: 'DELETE' },
			{ name: 'GET', value: 'GET' },
			{ name: 'PATCH', value: 'PATCH' },
			{ name: 'POST', value: 'POST' },
			{ name: 'PUT', value: 'PUT' },
		],
		default: 'GET',
		displayOptions: { show },
	},
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. printers/Get',
		description: 'Endpoint path relative to the company scope. Leading slash optional.',
		displayOptions: { show },
	},
	{
		displayName: 'Query Parameters',
		name: 'queryParams',
		type: 'json',
		default: '{}',
		description: 'JSON object of query string params',
		displayOptions: { show },
	},
	{
		displayName: 'JSON Body',
		name: 'body',
		type: 'json',
		default: '{}',
		description: 'JSON request body. Ignored for GET.',
		displayOptions: { show },
	},
	{
		displayName: 'Use Company Scope',
		name: 'useCompany',
		type: 'boolean',
		default: true,
		description: 'Whether to prefix the path with the bound company ID (/api/{company}/...). Turn off to hit company-scope-less endpoints like /0/account/GetUser.',
		displayOptions: { show },
	},
];
