import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

function getClient() {
	const rawUrl = process.env.TURSO_DATABASE_URL || '';
	const authToken = process.env.TURSO_AUTH_TOKEN || '';

	if (!rawUrl) {
		throw new Error(
			'TURSO_DATABASE_URL belum diatur. Pastikan ada di file .env'
		);
	}

	let libsqlUrl = rawUrl.startsWith('libsql://')
		? rawUrl.replace('libsql://', 'https://')
		: rawUrl;

	if (!/^https:\/\//i.test(libsqlUrl)) {
		libsqlUrl = 'https://' + libsqlUrl;
	}

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
