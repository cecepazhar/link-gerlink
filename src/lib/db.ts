import { json } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

function getClient() {
	const rawUrl = import.meta.env.TURSO_DATABASE_URL ?? '';
	const authToken = import.meta.env.TURSO_AUTH_TOKEN;

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
