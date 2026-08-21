<script lang="ts">
	import { getContext, tick } from 'svelte';
	import type i18nType from '$lib/i18n';

	import { config, models, user, tools as _tools } from '$lib/stores';

	import { toast } from 'svelte-sonner';

	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import IntegrationCatalogLoader from './IntegrationsMenu/IntegrationCatalogLoader.svelte';
	import IntegrationMenuContent from './IntegrationsMenu/IntegrationMenuContent.svelte';
	import * as integrationOAuth from './IntegrationsMenu/integrationOAuth';
	import { resolveIntegrationFeatureView } from './IntegrationsMenu/integrationFeatureView';
	import type { IntegrationItem, ToggleFilter, ValveTarget } from './IntegrationsMenu/types';
	import { resolveVisibleToggleFilters } from './IntegrationsMenu/visibleToggleFilters';
	import {
		parseModelIntegrationDefaults,
		resetIntegrationSelection,
		resolveIntegrationSelectionView,
		toggleIntegrationFeature,
		toggleIntegrationFilter,
		toggleIntegrationSkill,
		toggleIntegrationTool,
		type IntegrationFeatureId,
		type IntegrationSelection
	} from './integrationSelection';

	const i18n: typeof i18nType = getContext('i18n');

	export let selectedToolIds: string[] | null = [];
	export let selectedFeatureIds: IntegrationFeatureId[] | null = [];
	export let selectedSkillIds: string[] | null = [];

	export let selectedModels: string[] = [];
	export let toggleFilters: ToggleFilter[] = [];
	export let selectedFilterIds: string[] | null = [];

	export let showWebSearchButton = false;
	export let webSearchEnabled = false;
	export let showImageGenerationButton = false;
	export let imageGenerationEnabled = false;
	export let showCodeInterpreterButton = false;
	export let codeInterpreterEnabled = false;

	export let useModelDefaults = false;
	export let showModelDefaultOption = true;
	export let showSkills = true;
	export let showDirectServerTools = true;
	export let preserveUnavailableSelections = false;
	export let showToolValves = true;
	export let showFilterValves = true;
	export let side: 'top' | 'bottom' = 'bottom';
	export let align: 'start' | 'end' = 'start';
	export let contentRole: 'menu' | 'dialog' = 'menu';
	export let contentAriaLabel: string | undefined = undefined;

	export let onShowValves: (target: ValveTarget) => void = () => {};
	export let onClose: () => void = () => {};
	export let onWebSearchToggle: (state: boolean) => void = () => {};
	export let closeOnOutsideClick = true;

	let show = false;

	let tools: Record<string, IntegrationItem> | null = null;
	let skills: Record<string, IntegrationItem> | null = null;
	let toolQuery = '';
	let skillQuery = '';
	let catalogReloadToken = 0;

	$: toolIds = Object.keys(tools ?? {});
	$: skillIds = Object.keys(skills ?? {});
	$: selectedModel =
		selectedModels.length === 1 ? $models.find((model) => model.id === selectedModels[0]) : null;
	$: modelDefaults = parseModelIntegrationDefaults(selectedModel?.info?.meta);
	$: modelToggleFilters =
		useModelDefaults && Array.isArray(selectedModel?.filters)
			? selectedModel.filters
			: toggleFilters;
	$: selectionState = {
		toolIds: selectedToolIds,
		skillIds: selectedSkillIds,
		filterIds: selectedFilterIds,
		featureIds: selectedFeatureIds
	} satisfies IntegrationSelection;
	$: selectionView = resolveIntegrationSelectionView(
		selectionState,
		modelDefaults,
		useModelDefaults
	);
	$: effectiveToolIds = selectionView.effective.toolIds;
	$: effectiveSkillIds = selectionView.effective.skillIds;
	$: effectiveFilterIds = selectionView.effective.filterIds;
	$: effectiveFeatureIds = selectionView.effective.featureIds;
	$: inherited = selectionView.inherited;
	$: selectedCount = selectionView.selectedCount;
	$: visibleToggleFilters = resolveVisibleToggleFilters(
		modelToggleFilters,
		effectiveFilterIds,
		preserveUnavailableSelections
	);
	$: featureView = resolveIntegrationFeatureView({
		useModelDefaults,
		capabilities: modelDefaults.capabilities,
		enabledByConfig: {
			web_search: $config?.features?.enable_web_search,
			image_generation: $config?.features?.enable_image_generation
		},
		permitted: {
			web_search: $user?.role === 'admin' || $user?.permissions?.features?.web_search,
			image_generation: $user?.role === 'admin' || $user?.permissions?.features?.image_generation
		},
		explicitlyVisible: {
			web_search: showWebSearchButton,
			image_generation: showImageGenerationButton
		},
		effectiveIds: effectiveFeatureIds,
		explicitlyEnabled: { web_search: webSearchEnabled, image_generation: imageGenerationEnabled }
	});

	const applySelection = (updated: IntegrationSelection) => {
		selectedToolIds = updated.toolIds;
		selectedSkillIds = updated.skillIds;
		selectedFilterIds = updated.filterIds;
		selectedFeatureIds = updated.featureIds;
	};

	const toggleTool = async (toolId: string, e: MouseEvent) => {
		const tool = tools?.[toolId];
		if (!tool) return;

		if (!(tool.authenticated ?? true)) {
			e.preventDefault();
			integrationOAuth.startIntegrationOAuth(toolId);
			return;
		}

		await tick();

		if (useModelDefaults) {
			applySelection(toggleIntegrationTool(selectionState, modelDefaults, toolId));
			return;
		}

		selectedToolIds = effectiveToolIds.includes(toolId)
			? effectiveToolIds.filter((id) => id !== toolId)
			: [...effectiveToolIds, toolId];
	};

	const toggleFeature = (featureId: IntegrationFeatureId) => {
		if (useModelDefaults) {
			applySelection(toggleIntegrationFeature(selectionState, modelDefaults, featureId));
			return;
		}

		if (featureId === 'web_search') {
			webSearchEnabled = !webSearchEnabled;
			onWebSearchToggle(webSearchEnabled);
		} else {
			imageGenerationEnabled = !imageGenerationEnabled;
		}
	};

	const toggleSkill = async (skillId: string) => {
		const skill = skills?.[skillId];
		if (!skill) return;

		await tick();

		if (useModelDefaults) {
			applySelection(toggleIntegrationSkill(selectionState, modelDefaults, skillId));
			return;
		}

		selectedSkillIds = effectiveSkillIds.includes(skillId)
			? effectiveSkillIds.filter((id) => id !== skillId)
			: [...effectiveSkillIds, skillId];
	};

	const toggleFilter = (filterId: string) => {
		if (useModelDefaults) {
			applySelection(toggleIntegrationFilter(selectionState, modelDefaults, filterId));
			return;
		}

		selectedFilterIds = effectiveFilterIds.includes(filterId)
			? effectiveFilterIds.filter((id) => id !== filterId)
			: [...effectiveFilterIds, filterId];
	};

	const disconnectTool = async (toolId: string) => {
		try {
			_tools.set(await integrationOAuth.disconnectIntegrationOAuth(localStorage.token, toolId));
			toast.success($i18n.t('OAuth session disconnected'));
			if (useModelDefaults) {
				selectedToolIds = effectiveToolIds.filter((id) => id !== toolId);
				selectedSkillIds = [...effectiveSkillIds];
				selectedFilterIds = [...effectiveFilterIds];
				selectedFeatureIds = [...effectiveFeatureIds];
			} else {
				selectedToolIds = effectiveToolIds.filter((id) => id !== toolId);
			}
			catalogReloadToken += 1;
		} catch (err) {
			toast.error(err ?? $i18n.t('Failed to disconnect'));
		}
	};
</script>

<IntegrationCatalogLoader
	{show}
	{showSkills}
	{showDirectServerTools}
	{preserveUnavailableSelections}
	bind:selectedToolIds
	bind:selectedSkillIds
	{effectiveToolIds}
	{effectiveSkillIds}
	bind:tools
	bind:skills
	bind:toolQuery
	bind:skillQuery
	reloadToken={catalogReloadToken}
/>

<Dropdown
	bind:show
	{closeOnOutsideClick}
	{side}
	{align}
	{contentRole}
	{contentAriaLabel}
	onOpenChange={(state) => {
		if (state === false) {
			toolQuery = '';
			skillQuery = '';
			onClose();
		}
	}}
>
	<Tooltip content={$i18n.t('Integrations')} placement="top">
		<slot {inherited} {selectedCount} />
	</Tooltip>
	<div slot="content">
		<IntegrationMenuContent
			{tools}
			{skills}
			{toolIds}
			{skillIds}
			selectedToolIds={effectiveToolIds}
			selectedSkillIds={effectiveSkillIds}
			selectedFilterIds={effectiveFilterIds}
			toggleFilters={visibleToggleFilters}
			{showSkills}
			{useModelDefaults}
			{showModelDefaultOption}
			{inherited}
			webSearchVisible={featureView.webSearchVisible}
			webSearchEnabled={featureView.webSearchEnabled}
			imageGenerationVisible={featureView.imageGenerationVisible}
			imageGenerationEnabled={featureView.imageGenerationEnabled}
			{showCodeInterpreterButton}
			bind:codeInterpreterEnabled
			showFilterValves={showFilterValves &&
				($user?.role === 'admin' || ($user?.permissions?.chat?.valves ?? true))}
			showToolValves={showToolValves &&
				($user?.role === 'admin' || ($user?.permissions?.chat?.valves ?? true))}
			bind:toolQuery
			bind:skillQuery
			onDefault={() => applySelection(resetIntegrationSelection())}
			onToggleTool={toggleTool}
			onToggleSkill={toggleSkill}
			onToggleFilter={toggleFilter}
			onToggleFeature={toggleFeature}
			onDisconnectTool={disconnectTool}
			{onShowValves}
		/>
	</div>
</Dropdown>
