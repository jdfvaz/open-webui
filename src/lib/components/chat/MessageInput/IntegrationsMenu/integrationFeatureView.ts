import type { IntegrationFeatureId } from '../integrationSelection';

type FeatureFlags = Partial<Record<IntegrationFeatureId, boolean>>;

type IntegrationFeatureViewOptions = {
	readonly useModelDefaults: boolean;
	readonly capabilities: FeatureFlags;
	readonly enabledByConfig: FeatureFlags;
	readonly permitted: FeatureFlags;
	readonly explicitlyVisible: FeatureFlags;
	readonly effectiveIds: readonly IntegrationFeatureId[];
	readonly explicitlyEnabled: FeatureFlags;
};

export const resolveIntegrationFeatureView = (options: IntegrationFeatureViewOptions) => {
	const visible = (featureId: IntegrationFeatureId): boolean =>
		options.useModelDefaults
			? Boolean(
					options.capabilities[featureId] &&
					options.enabledByConfig[featureId] &&
					options.permitted[featureId]
				)
			: Boolean(options.explicitlyVisible[featureId]);
	const enabled = (featureId: IntegrationFeatureId): boolean =>
		options.useModelDefaults
			? options.effectiveIds.includes(featureId)
			: Boolean(options.explicitlyEnabled[featureId]);

	return {
		webSearchVisible: visible('web_search'),
		imageGenerationVisible: visible('image_generation'),
		webSearchEnabled: enabled('web_search'),
		imageGenerationEnabled: enabled('image_generation')
	};
};
