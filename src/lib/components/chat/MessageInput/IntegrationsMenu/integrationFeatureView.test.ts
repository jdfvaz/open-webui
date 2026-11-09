import { describe, expect, it } from 'vitest';
import { parseModelIntegrationDefaults } from '../integrationSelection';
import { resolveIntegrationFeatureView } from './integrationFeatureView';

describe('automation feature visibility', () => {
	it.each([
		{ metadata: undefined, search: true, images: true },
		{ metadata: {}, search: true, images: true },
		{ metadata: { capabilities: {} }, search: true, images: true },
		{ metadata: { capabilities: { web_search: false } }, search: false, images: true },
		{ metadata: { capabilities: { image_generation: false } }, search: true, images: false }
	])('uses chat capability defaults for $metadata', ({ metadata, search, images }) => {
		const defaults = parseModelIntegrationDefaults(metadata);

		const view = resolveIntegrationFeatureView({
			useModelDefaults: true,
			capabilities: defaults.capabilities,
			enabledByConfig: { web_search: true, image_generation: true },
			permitted: { web_search: true, image_generation: true },
			explicitlyVisible: {},
			effectiveIds: [],
			explicitlyEnabled: {}
		});

		expect([view.webSearchVisible, view.imageGenerationVisible]).toEqual([search, images]);
	});

	it('keeps configuration and permission restrictions on base models', () => {
		const view = resolveIntegrationFeatureView({
			useModelDefaults: true,
			capabilities: {},
			enabledByConfig: { web_search: false, image_generation: true },
			permitted: { web_search: true, image_generation: false },
			explicitlyVisible: {},
			effectiveIds: [],
			explicitlyEnabled: {}
		});

		expect([view.webSearchVisible, view.imageGenerationVisible]).toEqual([false, false]);
	});
});
