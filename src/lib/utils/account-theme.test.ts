import { describe, expect, it } from 'vitest';
import { accountThemePreference, parseAccountTheme } from './account-theme';

describe('account theme preferences', () => {
	it('accepts supported themes and rejects arbitrary settings', () => {
		for (const theme of ['light', 'dark', 'system', 'oled-dark', 'her']) {
			expect(parseAccountTheme(theme)).toBe(theme);
		}
		for (const value of [null, undefined, {}, 'unknown', 1]) {
			expect(parseAccountTheme(value)).toBeUndefined();
		}
	});

	it('uses the account preference ahead of a different local theme', () => {
		expect(
			accountThemePreference({
				account: 'light',
				cached: 'dark',
				accountId: 'alice',
				cachedAccountId: 'alice'
			})
		).toBe('light');
	});

	it('preserves a legacy preference when first connecting the account', () => {
		expect(
			accountThemePreference({
				account: undefined,
				cached: 'light',
				accountId: 'alice',
				cachedAccountId: null
			})
		).toBe('light');
	});

	it("does not inherit another account's cached theme", () => {
		expect(
			accountThemePreference({
				account: undefined,
				cached: 'dark',
				accountId: 'bob',
				cachedAccountId: 'alice'
			})
		).toBe('system');
	});
});
