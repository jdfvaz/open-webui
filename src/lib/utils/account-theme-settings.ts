import { getUserSettings, updateUserSettings } from '$lib/apis/users';
import { accountThemePreference, parseAccountTheme } from './account-theme';

export const loadAccountThemeSettings = async (session: {
	readonly accountId: string;
	readonly token: string;
	readonly isCurrent: () => boolean;
}) => {
	if (!session.isCurrent()) return;
	const userSettings = await getUserSettings(session.token);
	if (!session.isCurrent()) return;
	const preference = accountThemePreference({
		account: userSettings?.ui?.theme,
		cached: localStorage.getItem('theme'),
		accountId: session.accountId,
		cachedAccountId: localStorage.getItem('theme-account')
	});
	if (parseAccountTheme(userSettings?.ui?.theme) === undefined && preference !== 'system') {
		try {
			await updateUserSettings(session.token, {
				ui: { ...userSettings?.ui, theme: preference }
			});
		} catch (error) {
			if (!session.isCurrent()) return;
			console.error('Failed to sync account theme:', error);
		}
	}
	if (!session.isCurrent()) return;
	return { userSettings, preference };
};
