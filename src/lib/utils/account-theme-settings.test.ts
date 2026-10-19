import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAccountThemeSettings } from './account-theme-settings';

vi.mock('$lib/utils', () => ({ getUserPosition: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const deferred = <T>() => {
	let resolve: (value: T) => void = () => {
		throw new Error('Deferred promise is not initialized.');
	};
	const promise = new Promise<T>((complete) => {
		resolve = complete;
	});
	return { promise, resolve };
};

const setupSession = () => {
	const entries = new Map([
		['theme', 'light'],
		['theme-account', 'alice']
	]);
	const storage = {
		token: 'alice-token',
		getItem: (key: string) => entries.get(key) ?? null
	};
	vi.stubGlobal('localStorage', storage);
	const active = { accountId: 'alice', mounted: true };
	return {
		active,
		storage,
		session: {
			accountId: active.accountId,
			token: storage.token,
			isCurrent: () =>
				active.mounted && active.accountId === 'alice' && storage.token === 'alice-token'
		}
	};
};

describe('account theme migration session', () => {
	it.each(['token', 'account', 'unmount', 'signout'] as const)(
		'ignores a settings response when %s changes during the GET',
		async (change) => {
			// Given
			const { session, active, storage } = setupSession();
			const response = deferred<Response>();
			const requests: string[] = [];
			vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
				requests.push(init.method ?? 'GET');
				return init.method === 'GET' ? response.promise : Response.json({ ui: {} });
			});
			const loading = loadAccountThemeSettings(session);

			// When
			switch (change) {
				case 'token':
					storage.token = 'bob-token';
					break;
				case 'account':
					active.accountId = 'bob';
					break;
				case 'unmount':
					active.mounted = false;
					break;
				case 'signout':
					storage.token = '';
					active.accountId = '';
					break;
				default: {
					const unexpected: never = change;
					throw new TypeError(`Unexpected session change: ${unexpected}`);
				}
			}
			response.resolve(Response.json({ ui: { system: 'Alice preference' } }));

			// Then
			expect(await loading).toBeUndefined();
			expect(requests).toEqual(['GET']);
		}
	);

	it('ignores the completed migration when the account switches during the POST', async () => {
		// Given
		const { session, storage } = setupSession();
		const started = deferred<void>();
		const response = deferred<Response>();
		const writes: Headers[] = [];
		vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
			if (init.method === 'GET') return Response.json({ ui: { system: 'Alice preference' } });
			writes.push(new Headers(init.headers));
			started.resolve();
			return response.promise;
		});
		const loading = loadAccountThemeSettings(session);
		await started.promise;

		// When
		storage.token = 'bob-token';
		response.resolve(Response.json({ ui: { theme: 'light' } }));

		// Then
		expect(await loading).toBeUndefined();
		expect(writes.map((headers) => headers.get('Authorization'))).toEqual(['Bearer alice-token']);
	});

	it('migrates the legacy theme with the original account credentials', async () => {
		// Given
		const { session } = setupSession();
		const saved = { ui: { system: 'Alice preference', theme: 'light' } };
		const writes: { readonly authorization: string | null; readonly body: unknown }[] = [];
		vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
			if (init.method === 'GET') return Response.json({ ui: { system: 'Alice preference' } });
			writes.push({
				authorization: new Headers(init.headers).get('Authorization'),
				body: JSON.parse(String(init.body))
			});
			return Response.json(saved);
		});

		// When
		const result = await loadAccountThemeSettings(session);

		// Then
		expect(result?.preference).toBe('light');
		expect(writes).toEqual([{ authorization: 'Bearer alice-token', body: saved }]);
	});
});
