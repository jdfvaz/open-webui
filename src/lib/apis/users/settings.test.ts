import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateUserSettings } from './index';

vi.mock('$lib/utils', () => ({ getUserPosition: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('saving account settings', () => {
	it('propagates a network failure instead of reporting a saved theme', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new TypeError('Network unavailable');
			})
		);
		await expect(updateUserSettings('synthetic', { ui: { theme: 'light' } })).rejects.toThrow(
			'Network unavailable'
		);
	});

	it('propagates a malformed JSON response', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('{'))
		);
		await expect(
			updateUserSettings('synthetic', { ui: { theme: 'light' } })
		).rejects.toBeInstanceOf(SyntaxError);
	});

	it.each([null, [], 'saved', 1])(
		'rejects an invalid saved settings response: %j',
		async (body) => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => Response.json(body))
			);
			await expect(updateUserSettings('synthetic', { ui: { theme: 'light' } })).rejects.toThrow(
				'invalid saved user settings'
			);
		}
	);

	it('returns the saved preference and other settings', async () => {
		const saved = { ui: { theme: 'light', params: { temperature: 0.2 } } };
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json(saved))
		);
		await expect(updateUserSettings('synthetic', saved)).resolves.toEqual(saved);
	});
});
