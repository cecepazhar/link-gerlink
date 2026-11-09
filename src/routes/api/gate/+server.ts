import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET: check if user is already unlocked via cookie
export const GET: RequestHandler = async ({ cookies }) => {
	const cookiePin = cookies.get('access_pin');
	const adminPin = cookies.get('admin_pin');
	const expectedPin = process.env.PUBLIC_PIN || 'gerlinkjuara';
	const expectedAdminPin = process.env.ADMIN_PIN || '123456';

	if ((cookiePin && cookiePin === expectedPin) || (adminPin && adminPin === expectedAdminPin)) {
		return json({ success: true, authenticated: true });
	}

	return json({ success: false, authenticated: false }, { status: 401 });
};

// POST: verify PIN and set access session cookie (7 days)
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { pin } = body;

		const expectedPin = process.env.PUBLIC_PIN || 'gerlinkjuara';

		if (!pin || pin !== expectedPin) {
			return json({ success: false, error: 'PIN tidak sesuai. Silakan coba lagi.' }, { status: 401 });
		}

		cookies.set('access_pin', pin, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 days session
		});

		return json({ success: true, message: 'Akses berhasil dibuka.' });
	} catch (err: any) {
		return json({ success: false, error: 'Request tidak valid' }, { status: 400 });
	}
};

// DELETE: lock access / remove cookie
export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('access_pin', { path: '/' });
	return json({ success: true, message: 'Akses terkunci kembali' });
};
