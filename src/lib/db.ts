import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '#env/dynamic/private';

function getClient() {
	const rawUrl = env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
	const authToken = env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '';

	if (!rawUrl) {
		throw new Error(
			'TURSO_DATABASE_URL is not set. Add it to .env or set it as an environment variable.'
		);
	}

	const libsqlUrl = rawUrl.startsWith('libsql://')
		? rawUrl.replace('libsql://', '')
		: rawUrl;

	const client = createClient({
		url: libsqlUrl,
		authToken,
	});

	return drizzle(client);
}

let _db: ReturnType<typeof getClient> | null = null;

export function db() {
	if (!_db) _db = getClient();
	return _db;
}
