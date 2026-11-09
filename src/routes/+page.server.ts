import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const accessPin = cookies.get('access_pin');
	const adminPin = cookies.get('admin_pin');
	const expectedPublicPin = process.env.PUBLIC_PIN || 'gerlinkjuara';
	const expectedAdminPin = process.env.ADMIN_PIN || '123456';

	const isUnlocked =
		(accessPin && accessPin === expectedPublicPin) ||
		(adminPin && adminPin === expectedAdminPin);

	return {
		isUnlocked: !!isUnlocked
	};
};
