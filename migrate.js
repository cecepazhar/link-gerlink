import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
	console.log('Testing Turso connection...');
	await client.execute(`
		CREATE TABLE IF NOT EXISTS links (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			url TEXT NOT NULL,
			description TEXT,
			category TEXT NOT NULL DEFAULT 'Umum',
			icon TEXT DEFAULT '📁',
			is_pinned INTEGER NOT NULL DEFAULT 0,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
	`);

	await client.execute(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);

	console.log('Tables created or verified successfully!');
	const res = await client.execute("SELECT count(*) as count FROM links");
	console.log('Current links count:', res.rows[0]);
}

main().catch(err => {
	console.error('Migration error:', err);
	process.exit(1);
});
