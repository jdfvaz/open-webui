export const INTEGRATION_FEATURE_IDS = ['web_search', 'image_generation'] as const;

export type IntegrationFeatureId = (typeof INTEGRATION_FEATURE_IDS)[number];

export type IntegrationSelection = {
	readonly toolIds: string[] | null;
	readonly skillIds: string[] | null;
	readonly filterIds: string[] | null;
	readonly featureIds: IntegrationFeatureId[] | null;
};

export type EffectiveIntegrationSelection = {
	readonly toolIds: string[];
	readonly skillIds: string[];
	readonly filterIds: string[];
	readonly featureIds: IntegrationFeatureId[];
};

export type ModelIntegrationDefaults = EffectiveIntegrationSelection & {
	readonly capabilities: Partial<Record<IntegrationFeatureId, boolean>>;
};

export type IntegrationSelectionView = {
	readonly effective: EffectiveIntegrationSelection;
	readonly inherited: boolean;
	readonly selectedCount: number;
};

const isIntegrationFeatureId = (value: string): value is IntegrationFeatureId =>
	value === 'web_search' || value === 'image_generation';

const parseStringArray = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toggleId = (ids: readonly string[], id: string): string[] =>
	ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

export const resolveIntegrationSelection = (
	selection: IntegrationSelection,
	defaults: ModelIntegrationDefaults
): EffectiveIntegrationSelection => ({
	toolIds: [...(selection.toolIds ?? defaults.toolIds)],
	skillIds: [...(selection.skillIds ?? defaults.skillIds)],
	filterIds: [...(selection.filterIds ?? defaults.filterIds)],
	featureIds: [...(selection.featureIds ?? defaults.featureIds)]
});

export const resolveIntegrationSelectionView = (
	selection: IntegrationSelection,
	defaults: ModelIntegrationDefaults,
	useModelDefaults: boolean
): IntegrationSelectionView => {
	const effective = useModelDefaults
		? resolveIntegrationSelection(selection, defaults)
		: {
				toolIds: [...(selection.toolIds ?? [])],
				skillIds: [...(selection.skillIds ?? [])],
				filterIds: [...(selection.filterIds ?? [])],
				featureIds: [...(selection.featureIds ?? [])]
			};
	const inherited =
		useModelDefaults && Object.values(selection).every((selectedIds) => selectedIds === null);
	const selectedCount = Object.values(effective).reduce((count, selectedIds) => {
		return count + selectedIds.length;
	}, 0);

	return { effective, inherited, selectedCount };
};

export const toggleIntegrationTool = (
	selection: IntegrationSelection,
	defaults: ModelIntegrationDefaults,
	toolId: string
): IntegrationSelection => {
	const effective = resolveIntegrationSelection(selection, defaults);
	return {
		toolIds: toggleId(effective.toolIds, toolId),
		skillIds: effective.skillIds,
		filterIds: effective.filterIds,
		featureIds: effective.featureIds
	};
};

export const toggleIntegrationSkill = (
	selection: IntegrationSelection,
	defaults: ModelIntegrationDefaults,
	skillId: string
): IntegrationSelection => {
	const effective = resolveIntegrationSelection(selection, defaults);
	return {
		toolIds: effective.toolIds,
		skillIds: toggleId(effective.skillIds, skillId),
		filterIds: effective.filterIds,
		featureIds: effective.featureIds
	};
};

export const toggleIntegrationFilter = (
	selection: IntegrationSelection,
	defaults: ModelIntegrationDefaults,
	filterId: string
): IntegrationSelection => {
	const effective = resolveIntegrationSelection(selection, defaults);
	return {
		toolIds: effective.toolIds,
		skillIds: effective.skillIds,
		filterIds: toggleId(effective.filterIds, filterId),
		featureIds: effective.featureIds
	};
};

export const toggleIntegrationFeature = (
	selection: IntegrationSelection,
	defaults: ModelIntegrationDefaults,
	featureId: IntegrationFeatureId
): IntegrationSelection => {
	const effective = resolveIntegrationSelection(selection, defaults);
	return {
		toolIds: effective.toolIds,
		skillIds: effective.skillIds,
		filterIds: effective.filterIds,
		featureIds: effective.featureIds.includes(featureId)
			? effective.featureIds.filter((id) => id !== featureId)
			: [...effective.featureIds, featureId]
	};
};

export const resetIntegrationSelection = (): IntegrationSelection => ({
	toolIds: null,
	skillIds: null,
	filterIds: null,
	featureIds: null
});

export const mergeVisibleIntegrationIds = (
	availableIds: readonly string[],
	selectedIds: readonly string[]
): string[] => [...availableIds, ...selectedIds.filter((id) => !availableIds.includes(id))];

export const parseModelIntegrationDefaults = (value: unknown): ModelIntegrationDefaults => {
	if (value === null || typeof value !== 'object') {
		return { toolIds: [], skillIds: [], filterIds: [], featureIds: [], capabilities: {} };
	}

	const toolIds = 'toolIds' in value ? parseStringArray(value.toolIds) : [];
	const skillIds = 'skillIds' in value ? parseStringArray(value.skillIds) : [];
	const filterIds = 'defaultFilterIds' in value ? parseStringArray(value.defaultFilterIds) : [];
	const featureIds =
		'defaultFeatureIds' in value
			? parseStringArray(value.defaultFeatureIds).filter(isIntegrationFeatureId)
			: [];
	const capabilities =
		'capabilities' in value && value.capabilities !== null && typeof value.capabilities === 'object'
			? {
					web_search: 'web_search' in value.capabilities && value.capabilities.web_search === true,
					image_generation:
						'image_generation' in value.capabilities && value.capabilities.image_generation === true
				}
			: {};

	return { toolIds, skillIds, filterIds, featureIds, capabilities };
};
