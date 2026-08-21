<script lang="ts">
	import DropdownMenu from '$lib/components/common/DropdownMenu.svelte';
	import OverviewPanel from './OverviewPanel.svelte';
	import SkillsPanel from './SkillsPanel.svelte';
	import ToolsPanel from './ToolsPanel.svelte';
	import type { IntegrationFeatureId } from '../integrationSelection';
	import type { IntegrationItem, ToggleFilter, ValveTarget } from './types';

	export let tools: Record<string, IntegrationItem> | null = null;
	export let skills: Record<string, IntegrationItem> | null = null;
	export let toolIds: string[] = [];
	export let skillIds: string[] = [];
	export let selectedToolIds: string[] = [];
	export let selectedSkillIds: string[] = [];
	export let selectedFilterIds: string[] = [];
	export let toggleFilters: ToggleFilter[] = [];
	export let showSkills = true;
	export let useModelDefaults = false;
	export let showModelDefaultOption = true;
	export let inherited = false;
	export let webSearchVisible = false;
	export let webSearchEnabled = false;
	export let imageGenerationVisible = false;
	export let imageGenerationEnabled = false;
	export let showCodeInterpreterButton = false;
	export let codeInterpreterEnabled = false;
	export let showFilterValves = false;
	export let showToolValves = false;
	export let toolQuery = '';
	export let skillQuery = '';
	export let onDefault: () => void = () => {};
	export let onToggleTool: (toolId: string, event: MouseEvent) => Promise<void> = async () => {};
	export let onToggleSkill: (skillId: string) => Promise<void> = async () => {};
	export let onToggleFilter: (filterId: string) => void = () => {};
	export let onToggleFeature: (featureId: IntegrationFeatureId) => void = () => {};
	export let onDisconnectTool: (toolId: string) => Promise<void> = async () => {};
	export let onShowValves: (target: ValveTarget) => void = () => {};

	let tab: '' | 'tools' | 'skills' = '';
</script>

<DropdownMenu className="min-w-70 max-w-70 max-h-72 overflow-hidden">
	{#if tab === ''}
		<OverviewPanel
			{tools}
			{skills}
			{showSkills}
			{useModelDefaults}
			{showModelDefaultOption}
			{inherited}
			{toggleFilters}
			{selectedFilterIds}
			{webSearchVisible}
			{webSearchEnabled}
			{imageGenerationVisible}
			{imageGenerationEnabled}
			{showCodeInterpreterButton}
			bind:codeInterpreterEnabled
			{showFilterValves}
			{onDefault}
			onOpenTools={() => (tab = 'tools')}
			onOpenSkills={() => (tab = 'skills')}
			{onToggleFilter}
			{onToggleFeature}
			{onShowValves}
		/>
	{:else if tab === 'tools' && tools}
		<ToolsPanel
			{tools}
			{toolIds}
			{selectedToolIds}
			bind:toolQuery
			onBack={() => {
				toolQuery = '';
				tab = '';
			}}
			onToggle={onToggleTool}
			onDisconnect={onDisconnectTool}
			{onShowValves}
			showValves={showToolValves}
		/>
	{:else if showSkills && tab === 'skills' && skills}
		<SkillsPanel
			{skills}
			{skillIds}
			{selectedSkillIds}
			bind:skillQuery
			onBack={() => {
				skillQuery = '';
				tab = '';
			}}
			onToggle={onToggleSkill}
		/>
	{/if}
</DropdownMenu>
