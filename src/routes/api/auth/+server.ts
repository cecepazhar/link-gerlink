import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET: check if session cookie is valid
export const GET: RequestHandler = async ({ cookies }) => {
	const cookiePin = cookies.get('admin_pin');
	const expectedPin = process.env.ADMIN_PIN || '123456';

	if (cookiePin && cookiePin === expectedPin) {
		return json({ success: true, authenticated: true });
	}

	return json({ success: false, authenticated: false }, { status: 401 });
};

// POST: verify PIN and set admin session cookie
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { pin } = body;

		const expectedPin = process.env.ADMIN_PIN || '123456';

		if (!pin || pin !== expectedPin) {
			return json({ success: false, error: 'PIN salah. Silakan coba lagi.' }, { status: 401 });
		}

		cookies.set('admin_pin', pin, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 days session
		});

		return json({ success: true, message: 'Login berhasil, cookie admin terpasang.' });
	} catch (err: any) {
		return json({ success: false, error: 'Request tidak valid' }, { status: 400 });
	}
};

// DELETE: logout
export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('admin_pin', { path: '/' });
	return json({ success: true, message: 'Berhasil logout' });
};
