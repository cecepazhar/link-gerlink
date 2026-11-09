import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

function getClient() {
	const rawUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
	const authToken = process.env.TURSO_AUTH_TOKEN || '';

	if (!rawUrl) {
		throw new Error(
			'TURSO_DATABASE_URL belum diatur. Pastikan ada di file .env'
		);
	}

	let libsqlUrl = rawUrl;
	if (rawUrl.startsWith('libsql://')) {
		libsqlUrl = rawUrl.replace('libsql://', 'https://');
	} else if (!rawUrl.startsWith('file:') && !/^https?:\/\//i.test(rawUrl)) {
		libsqlUrl = 'https://' + rawUrl;
	}

	const client = createClient({
		url: libsqlUrl,
		authToken: authToken || undefined,
	});

	return drizzle(client);
}

let _db: ReturnType<typeof getClient> | null = null;

export function db() {
	if (!_db) _db = getClient();
	return _db;
}
