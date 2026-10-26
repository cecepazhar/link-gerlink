import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const links = sqliteTable('links', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	url: text('url').notNull(),
	description: text('description'),
	category: text('category').notNull().default('Umum'),
	icon: text('icon').default('📁'),
	is_pinned: integer('is_pinned').notNull().default(0),
	sort_order: integer('sort_order').notNull().default(0),
	created_at: integer('created_at').notNull().default(sql`(unixepoch())`),
	updated_at: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
});
