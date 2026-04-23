import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import type { SimplyprintResponse } from './types';

export type SimplyprintContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IHookFunctions
	| IWebhookFunctions;

export interface SimplyprintCallOptions {
	method: IHttpRequestMethods;
	path: string;
	body?: IDataObject | Buffer;
	qs?: IDataObject;
	/**
	 * Override the URL-path company segment. When omitted, the endpoint is
	 * scoped to the credential's company (OAuth: resolved + cached in static
	 * data; API key: supplied by the user on the credential). Pass `0`
	 * explicitly for endpoints that don't require a company (e.g. GetUser).
	 */
	company?: number;
	/**
	 * For multipart uploads - if set, overrides the default JSON body handling.
	 */
	formData?: IDataObject;
	/**
	 * Override the host URL (e.g. for files.simplyprint.io uploads, which are
	 * served by a separate domain). When set, the request URL is built as
	 * `${baseUrlOverride}/${companyId}/${path}` instead of using the
	 * credential's panelUrl + `/api`.
	 */
	baseUrlOverride?: string;
}

type AuthKind = 'oAuth2' | 'apiKey';

interface ResolvedAuth {
	kind: AuthKind;
	credentialType: 'simplyPrintOAuth2Api' | 'simplyPrintApi';
	panelUrl: string;
	companyId: number;
}

/**
 * Read the node parameter `authentication` (expected to be on every
 * SimplyPrint node and trigger) and load the matching credential. Also
 * resolves the target companyId (cached in workflow static data for
 * OAuth2 since the token is bound to a single company but we only know
 * which one by calling GetUser).
 */
async function resolveAuth(ctx: SimplyprintContext): Promise<ResolvedAuth> {
	const kind = ctx.getNodeParameter('authentication', 0, 'oAuth2') as AuthKind;

	if (kind === 'apiKey') {
		const creds = await ctx.getCredentials('simplyPrintApi');
		const panelUrl = String(creds.panelUrl ?? 'https://simplyprint.io').replace(/\/+$/, '');
		const companyId = Number(creds.companyId);
		if (!Number.isFinite(companyId) || companyId <= 0) {
			throw new NodeApiError(ctx.getNode(), {
				message: 'SimplyPrint API-key credential has no valid Company ID.',
			});
		}
		return { kind, credentialType: 'simplyPrintApi', panelUrl, companyId };
	}

	const creds = await ctx.getCredentials('simplyPrintOAuth2Api');
	const panelUrl = String(creds.panelUrl ?? 'https://simplyprint.io').replace(/\/+$/, '');
	const companyId = await resolveOAuthCompany(ctx, panelUrl);
	return { kind, credentialType: 'simplyPrintOAuth2Api', panelUrl, companyId };
}

/**
 * Resolve (and cache) the OAuth2 token's bound company via `GET /api/0/account/GetUser`.
 * The patched GetUser endpoint returns `{ user, company }` for OAuth callers
 * (see api/API/Endpoints/account/GetUser.php).
 *
 * Cache lives in workflow static data keyed by panel URL so credential swaps
 * across accounts don't poison it.
 */
async function resolveOAuthCompany(ctx: SimplyprintContext, panelUrl: string): Promise<number> {
	const staticData = ctx.getWorkflowStaticData('global') as IDataObject;
	const cacheKey = `simplyPrintCompany:${panelUrl}`;
	const cached = staticData[cacheKey];
	if (typeof cached === 'number' && cached > 0) return cached;

	const res = await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'simplyPrintOAuth2Api', {
		method: 'GET',
		url: `${panelUrl}/api/0/account/GetUser`,
		json: true,
	} as IHttpRequestOptions);

	const body = res as { status?: boolean; company?: { id?: number }; message?: string };
	if (!body?.status) {
		throw new NodeApiError(ctx.getNode(), {
			message: body?.message ?? 'SimplyPrint rejected the OAuth2 token.',
		});
	}
	const id = Number(body.company?.id);
	if (!Number.isFinite(id) || id <= 0) {
		throw new NodeApiError(ctx.getNode(), {
			message: 'SimplyPrint OAuth2 token is not bound to a company.',
		});
	}
	staticData[cacheKey] = id;
	return id;
}

/**
 * Issue a SimplyPrint API call. Auto-prefixes the company segment, injects
 * the right auth (OAuth2 Bearer or X-API-Key header) via
 * `httpRequestWithAuthentication`, and unwraps the `{ status, message?,
 * objects? }` envelope - throwing on `status === false`.
 */
export async function simplyprintCall<T = unknown>(
	ctx: SimplyprintContext,
	opts: SimplyprintCallOptions,
): Promise<SimplyprintResponse<T>> {
	const auth = await resolveAuth(ctx);
	const companyId = opts.company !== undefined ? opts.company : auth.companyId;

	const url = opts.baseUrlOverride
		? `${opts.baseUrlOverride.replace(/\/+$/, '')}/${companyId}/${opts.path.replace(/^\//, '')}`
		: `${auth.panelUrl}/api/${companyId}/${opts.path.replace(/^\//, '')}`;

	const requestOptions: IHttpRequestOptions = {
		method: opts.method,
		url,
		qs: opts.qs,
		json: true,
	};

	if (opts.formData) {
		// httpRequestWithAuthentication supports `body` + `formData`-shaped
		// requests by setting body to the object and disabling json.
		requestOptions.body = opts.formData;
		requestOptions.json = false;
	} else if (opts.body !== undefined) {
		requestOptions.body = opts.body;
	}

	let response: unknown;
	try {
		response = await ctx.helpers.httpRequestWithAuthentication.call(
			ctx,
			auth.credentialType,
			requestOptions,
		);
	} catch (error) {
		throw new NodeApiError(ctx.getNode(), error as JsonObject);
	}

	const body = response as SimplyprintResponse<T>;
	if (!body || body.status === false) {
		throw new NodeApiError(ctx.getNode(), {
			message: body?.message ?? `SimplyPrint ${opts.method} ${opts.path} failed`,
		});
	}
	return body;
}

/**
 * Variant for lifecycle hooks that don't have access to node parameters the
 * way execute does - reads auth kind directly from the hook context.
 */
export async function simplyprintHookCall<T = unknown>(
	ctx: IHookFunctions,
	opts: SimplyprintCallOptions,
): Promise<SimplyprintResponse<T>> {
	return simplyprintCall<T>(ctx, opts);
}
