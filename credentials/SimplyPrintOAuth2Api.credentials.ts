import type { ICredentialType, INodeProperties } from 'n8n-workflow';

/**
 * OAuth2 credential for SimplyPrint.
 *
 * We don't `extends: ['oAuth2Api']` because n8n's generic OAuth2 credential
 * hard-codes its property order and we want the scope list to be user-visible
 * but read-only. Instead we declare the full property set ourselves - the
 * `genericOAuth2ApiCredentialTest` logic in n8n discovers OAuth2-shaped
 * credentials via the presence of `accessTokenUrl` + `authUrl`.
 *
 * Redirect URI shown to the user:
 *   https://<your-n8n>/rest/oauth2-credential/callback
 *
 * That URL must be whitelisted in the SimplyPrint OAuth client
 * (Panel -> Admin -> OAuth clients).
 */
export class SimplyPrintOAuth2Api implements ICredentialType {
	name = 'simplyPrintOAuth2Api';

	displayName = 'SimplyPrint OAuth2 API';

	documentationUrl = 'https://simplyprint.io/integrations/n8n';

	extends = ['oAuth2Api'];

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Panel URL',
			name: 'panelUrl',
			type: 'string',
			default: 'https://simplyprint.io',
			description:
				'SimplyPrint panel base URL. Leave as https://simplyprint.io for production; SimplyPrint staff can override for staging.',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '={{$self["panelUrl"]}}/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '={{$self["panelUrl"]}}/oauth/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default:
				'user.read printers.read printers.write printers.actions queue.read queue.write files.read files.write files.temp_upload spools.read spools.write print_history.read statistics.read custom_fields.read tags.read webhooks.read webhooks.write',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];
}
