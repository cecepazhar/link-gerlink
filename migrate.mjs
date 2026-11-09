import { createClient } from '@libsql/client';

// Node v24 --env-file loads vars from .env
const rawUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

let libsqlUrl = rawUrl;
if (rawUrl.startsWith('libsql://')) {
	libsqlUrl = rawUrl.replace('libsql://', 'https://');
} else if (!rawUrl.startsWith('file:') && !/^https?:\/\//i.test(rawUrl)) {
	libsqlUrl = 'https://' + rawUrl;
}

const client = createClient({
	url: libsqlUrl,
	authToken: authToken || undefined
});

async function main() {
	console.log('Testing Turso / LibSQL connection...');
	await client.execute(`
		CREATE TABLE IF NOT EXISTS links (\n			id TEXT PRIMARY KEY,\n			title TEXT NOT NULL,\n			url TEXT NOT NULL,\n			description TEXT,\n			category TEXT NOT NULL DEFAULT 'Umum',\n			icon TEXT DEFAULT '📁',\n			is_pinned INTEGER NOT NULL DEFAULT 0,\n			sort_order INTEGER NOT NULL DEFAULT 0,\n			created_at INTEGER NOT NULL DEFAULT (unixepoch()),\n			updated_at INTEGER NOT NULL DEFAULT (unixepoch())\n		);
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS settings (\n			key TEXT PRIMARY KEY,\n			value TEXT NOT NULL\n		);
	`);

	console.log('Tables created or verified successfully!');
	const res = await client.execute("SELECT count(*) as count FROM links");
	console.log('Current links count:', res.rows[0]);
}

main().catch(err => {
	console.error('Migration error:', err);
	process.exit(1);
});
