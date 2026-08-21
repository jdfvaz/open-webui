import { describe, expect, it } from 'vitest';

import {
	mergeVisibleIntegrationIds,
	parseModelIntegrationDefaults,
	resetIntegrationSelection,
	resolveIntegrationSelection,
	toggleIntegrationFeature,
	toggleIntegrationFilter,
	toggleIntegrationSkill,
	toggleIntegrationTool,
	type IntegrationSelection,
	type ModelIntegrationDefaults
} from './integrationSelection';

const defaults: ModelIntegrationDefaults = {
	toolIds: ['github'],
	skillIds: ['release-notes'],
	filterIds: ['deep-research'],
	featureIds: ['web_search'],
	capabilities: { web_search: true, image_generation: true }
};

describe('automation integration selection', () => {
	it('inherits every model default when every axis is null', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: null,
			filterIds: null,
			featureIds: null
		};

		// When
		const effective = resolveIntegrationSelection(selection, defaults);

		// Then
		expect(effective).toEqual({
			toolIds: ['github'],
			skillIds: ['release-notes'],
			filterIds: ['deep-research'],
			featureIds: ['web_search']
		});
	});

	it('preserves explicit empty selections', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: [],
			skillIds: [],
			filterIds: [],
			featureIds: []
		};

		// When
		const effective = resolveIntegrationSelection(selection, defaults);

		// Then
		expect(effective).toEqual({ toolIds: [], skillIds: [], filterIds: [], featureIds: [] });
	});

	it('resolves mixed inherited and explicit axes independently', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: [],
			filterIds: null,
			featureIds: []
		};

		// When
		const effective = resolveIntegrationSelection(selection, defaults);

		// Then
		expect(effective).toEqual({
			toolIds: ['github'],
			skillIds: [],
			filterIds: ['deep-research'],
			featureIds: []
		});
	});

	it('materializes both defaults before toggling a tool', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: null,
			filterIds: null,
			featureIds: null
		};

		// When
		const updated = toggleIntegrationTool(selection, defaults, 'jira');

		// Then
		expect(updated).toEqual({
			toolIds: ['github', 'jira'],
			skillIds: ['release-notes'],
			filterIds: ['deep-research'],
			featureIds: ['web_search']
		});
	});

	it('materializes every default before toggling a skill', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: null,
			filterIds: null,
			featureIds: null
		};

		// When
		const updated = toggleIntegrationSkill(selection, defaults, 'release-notes');

		// Then
		expect(updated).toEqual({
			toolIds: ['github'],
			skillIds: [],
			filterIds: ['deep-research'],
			featureIds: ['web_search']
		});
	});

	it('materializes every default before toggling a filter', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: null,
			filterIds: null,
			featureIds: null
		};

		// When
		const updated = toggleIntegrationFilter(selection, defaults, 'deep-research');

		// Then
		expect(updated).toEqual({
			toolIds: ['github'],
			skillIds: ['release-notes'],
			filterIds: [],
			featureIds: ['web_search']
		});
	});

	it('materializes both defaults before toggling a feature', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: null,
			filterIds: null,
			featureIds: null
		};

		// When
		const updated = toggleIntegrationFeature(selection, defaults, 'image_generation');

		// Then
		expect(updated).toEqual({
			toolIds: ['github'],
			skillIds: ['release-notes'],
			filterIds: ['deep-research'],
			featureIds: ['web_search', 'image_generation']
		});
	});

	it('resets every axis to inherited defaults', () => {
		// When
		const updated = resetIntegrationSelection();

		// Then
		expect(updated).toEqual({
			toolIds: null,
			skillIds: null,
			filterIds: null,
			featureIds: null
		});
	});

	it('follows changed defaults only on inherited axes', () => {
		// Given
		const selection: IntegrationSelection = {
			toolIds: null,
			skillIds: [],
			filterIds: null,
			featureIds: []
		};
		const changedDefaults: ModelIntegrationDefaults = {
			toolIds: ['jira'],
			skillIds: ['incident-review'],
			filterIds: ['quick-research'],
			featureIds: ['image_generation'],
			capabilities: { web_search: true, image_generation: true }
		};

		// When
		const effective = resolveIntegrationSelection(selection, changedDefaults);

		// Then
		expect(effective).toEqual({
			toolIds: ['jira'],
			skillIds: [],
			filterIds: ['quick-research'],
			featureIds: []
		});
	});

	it('keeps selected unavailable IDs visible', () => {
		// Given
		const availableIds = ['github'];
		const selectedIds = ['github', 'removed-tool'];

		// When
		const visibleIds = mergeVisibleIntegrationIds(availableIds, selectedIds);

		// Then
		expect(visibleIds).toEqual(['github', 'removed-tool']);
	});

	it('parses malformed model metadata as empty defaults', () => {
		// Given
		const metadata = {
			toolIds: 'github',
			skillIds: [42],
			defaultFilterIds: 'deep-research',
			defaultFeatureIds: [42],
			capabilities: 'all'
		};

		// When
		const parsed = parseModelIntegrationDefaults(metadata);

		// Then
		expect(parsed).toEqual({
			toolIds: [],
			skillIds: [],
			filterIds: [],
			featureIds: [],
			capabilities: {}
		});
	});
});
