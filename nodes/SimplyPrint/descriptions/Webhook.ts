import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhook'] };

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{
				name: 'Trigger Test',
				value: 'triggerTest',
				action: 'Fire a test webhook from the server',
				description:
					'Ask SimplyPrint to send a test delivery to a configured webhook - handy for exercising n8n trigger nodes during development',
			},
		],
		default: 'triggerTest',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'number',
		default: 0,
		required: true,
		placeholder: 'e.g. 14',
		description: 'Numeric ID of the webhook on SimplyPrint (Panel -> Settings -> Webhooks)',
		displayOptions: { show: { resource: ['webhook'], operation: ['triggerTest'] } },
	},
];
