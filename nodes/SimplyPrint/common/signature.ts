import { randomBytes, timingSafeEqual } from 'crypto';

/**
 * Per-webhook secret used to verify incoming payloads.
 * 32 bytes / 64 hex chars - high entropy and fits the `secret` field
 * validator (`string|max:128`) in SimplyPrint's webhook create endpoint.
 */
export function generateWebhookSecret(): string {
	return randomBytes(32).toString('hex');
}

/**
 * Verify an incoming webhook payload against the per-webhook secret.
 *
 * SimplyPrint sends the shared secret VERBATIM in the `X-SP-Secret` header
 * on every delivery. Verification is a constant-time string comparison
 * against the stored secret. (No HMAC of the body - the header IS the
 * shared secret.)
 */
export function verifySimplyprintSignature(
	header: string | undefined,
	secret: string | undefined,
): boolean {
	if (!secret || !header) return false;
	if (header.length !== secret.length) return false;

	try {
		return timingSafeEqual(Buffer.from(secret, 'utf8'), Buffer.from(header, 'utf8'));
	} catch {
		return false;
	}
}

/**
 * n8n lower-cases incoming header names, but proxies may forward the
 * original case. Check both.
 */
export function extractSecretHeader(
	headers: Record<string, string | string[] | undefined>,
): string | undefined {
	const raw = headers['x-sp-secret'] ?? headers['X-SP-Secret'] ?? headers['X-Sp-Secret'];
	if (Array.isArray(raw)) return raw[0];
	return raw;
}
