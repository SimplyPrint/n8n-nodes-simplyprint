import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

/**
 * Shared "Authentication" selector shown on every SimplyPrint node + trigger.
 * Mirrors the Calendly pattern - the selected value conditionally shows
 * the matching credential under the credential picker (see `buildCredentialsArray`).
 */
export const AUTHENTICATION_OPTIONS: INodePropertyOptions[] = [
	{
		name: 'OAuth2 (Recommended)',
		value: 'oAuth2',
	},
	{
		name: 'API Key',
		value: 'apiKey',
	},
];

export const authenticationProperty: INodeProperties = {
	displayName: 'Authentication',
	name: 'authentication',
	type: 'options',
	options: AUTHENTICATION_OPTIONS,
	default: 'oAuth2',
	description:
		'How this node authenticates to SimplyPrint. Use OAuth2 for hosted n8n or any instance whose callback URL is whitelisted on the SimplyPrint OAuth client. Use API Key if you cannot whitelist (e.g. self-host with no public callback).',
};

/**
 * Credentials array to attach to a node description. Both credentials are
 * declared but only the matching one is visible based on the `authentication`
 * dropdown value.
 */
export const SIMPLYPRINT_CREDENTIALS = [
	{
		name: 'simplyPrintOAuth2Api',
		required: true,
		displayOptions: {
			show: { authentication: ['oAuth2'] },
		},
	},
	{
		name: 'simplyPrintApi',
		required: true,
		displayOptions: {
			show: { authentication: ['apiKey'] },
		},
	},
];
