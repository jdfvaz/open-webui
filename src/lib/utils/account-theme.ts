export const accountThemes = ['light', 'dark', 'system', 'oled-dark', 'her'] as const;
export type AccountTheme = (typeof accountThemes)[number];

export const parseAccountTheme = (value: unknown): AccountTheme | undefined =>
	accountThemes.find((theme) => theme === value);

export const accountThemePreference = (source: {
	readonly account: unknown;
	readonly cached: unknown;
	readonly accountId: string;
	readonly cachedAccountId: string | null;
}): AccountTheme =>
	parseAccountTheme(source.account) ??
	(source.cachedAccountId === null || source.cachedAccountId === source.accountId
		? parseAccountTheme(source.cached)
		: undefined) ??
	'system';

export const applyAccountTheme = (preference: AccountTheme): void => {
	localStorage.setItem('theme', preference);
	const root = document.documentElement;
	const resolved = {
		light: 'light',
		dark: 'dark',
		system: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
		'oled-dark': 'dark',
		her: 'her'
	}[preference];
	root.classList.remove('light', 'dark', 'oled-dark', 'her');
	root.classList.add(resolved);
	root.style.colorScheme =
		preference === 'system' ? 'light dark' : resolved === 'dark' ? 'dark' : 'light';
	const grays =
		preference === 'oled-dark'
			? { 800: '#101010', 850: '#050505', 900: '#000000', 950: '#000000' }
			: { 800: '#333', 850: '#262626', 900: '#171717', 950: '#0d0d0d' };
	Object.entries(grays).forEach(([shade, color]) => {
		root.style.setProperty(`--color-gray-${shade}`, color);
	});
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute(
			'content',
			preference === 'oled-dark'
				? '#000000'
				: resolved === 'dark'
					? '#171717'
					: resolved === 'her'
						? '#983724'
						: '#ffffff'
		);
};
