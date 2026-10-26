import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { links } from '$lib/schema';
import { desc, asc, and, eq, like, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET all links or search
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const cat = url.searchParams.get('cat')?.trim() ?? '';

	try {
		const conditions = [];
		if (q) {
			conditions.push(or(like(links.title, `%${q}%`), like(links.description, `%${q}%`)));
		}
		if (cat && cat !== 'Semua') {
			conditions.push(eq(links.category, cat));
		}

		const result = await (conditions.length > 0
			? db()
					.select()
					.from(links)
					.where(and(...conditions))
					.orderBy(desc(links.is_pinned), asc(links.sort_order), desc(links.created_at))
			: db()
					.select()
					.from(links)
					.orderBy(desc(links.is_pinned), asc(links.sort_order), desc(links.created_at)));

		const allCats = await db().select({ category: links.category }).from(links);
		const categories = Array.from(new Set(allCats.map((c: any) => c.category))).filter(Boolean);

		return json({ success: true, links: result, categories });
	} catch (err: any) {
		console.error('Fetch links error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};

// POST: Add new link
export const POST: RequestHandler = async ({ request, cookies }) => {
	const authPin = cookies.get('admin_pin');
	const expectedPin = process.env.ADMIN_PIN || '123456';

	if (authPin !== expectedPin) {
		return json({ success: false, error: 'Unauthorized: PIN tidak valid' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { title, url: linkUrl, description, category, icon, is_pinned } = body;

		if (!title || !linkUrl) {
			return json({ success: false, error: 'Judul dan URL wajib diisi' }, { status: 400 });
		}

		const id = nanoid(10);
		await db()
			.insert(links)
			.values({
				id,
				title: title.trim(),
				url: linkUrl.trim(),
				description: description?.trim() || null,
				category: category?.trim() || 'Umum',
				icon: icon?.trim() || '📁',
				is_pinned: is_pinned ? 1 : 0,
				sort_order: 0,
			});

		return json({ success: true, id });
	} catch (err: any) {
		console.error('Insert link error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};

// PUT: Update link
export const PUT: RequestHandler = async ({ request, cookies }) => {
	const authPin = cookies.get('admin_pin');
	const expectedPin = process.env.ADMIN_PIN || '123456';

	if (authPin !== expectedPin) {
		return json({ success: false, error: 'Unauthorized: PIN tidak valid' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id, title, url: linkUrl, description, category, icon, is_pinned } = body;

		if (!id || !title || !linkUrl) {
			return json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
		}

		await db()
			.update(links)
			.set({
				title: title.trim(),
				url: linkUrl.trim(),
				description: description?.trim() || null,
				category: category?.trim() || 'Umum',
				icon: icon?.trim() || '📁',
				is_pinned: is_pinned ? 1 : 0,
				updated_at: Math.floor(Date.now() / 1000),
			})
			.where(eq(links.id, id));

		return json({ success: true });
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};

// DELETE: Remove link
export const DELETE: RequestHandler = async ({ request, cookies }) => {
	const authPin = cookies.get('admin_pin');
	const expectedPin = process.env.ADMIN_PIN || '123456';

	if (authPin !== expectedPin) {
		return json({ success: false, error: 'Unauthorized: PIN tidak valid' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
		}

		await db().delete(links).where(eq(links.id, id));
		return json({ success: true });
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
