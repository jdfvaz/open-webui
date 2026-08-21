<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import type i18nType from '$lib/i18n';

	import ChevronRight from '$lib/components/icons/ChevronRight.svelte';
	import Cube from '$lib/components/icons/Cube.svelte';
	import GlobeAlt from '$lib/components/icons/GlobeAlt.svelte';
	import Knobs from '$lib/components/icons/Knobs.svelte';
	import Photo from '$lib/components/icons/Photo.svelte';
	import Sparkles from '$lib/components/icons/Sparkles.svelte';
	import Terminal from '$lib/components/icons/Terminal.svelte';
	import Wrench from '$lib/components/icons/Wrench.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import type { IntegrationFeatureId } from '../integrationSelection';

	type ToggleFilter = {
		readonly id: string;
		readonly name: string;
		readonly description?: string;
		readonly icon?: string;
		readonly has_user_valves?: boolean;
	};
	type ValveTarget = { readonly type: 'function'; readonly id: string };

	const i18n: typeof i18nType = getContext('i18n');

	export let tools: Record<string, unknown> | null = null;
	export let skills: Record<string, unknown> | null = null;
	export let showSkills = true;
	export let useModelDefaults = false;
	export let showModelDefaultOption = true;
	export let inherited = false;
	export let toggleFilters: ToggleFilter[] = [];
	export let selectedFilterIds: string[] = [];
	export let webSearchVisible = false;
	export let webSearchEnabled = false;
	export let imageGenerationVisible = false;
	export let imageGenerationEnabled = false;
	export let showCodeInterpreterButton = false;
	export let codeInterpreterEnabled = false;
	export let showFilterValves = false;
	export let onDefault: () => void = () => {};
	export let onOpenTools: () => void = () => {};
	export let onOpenSkills: () => void = () => {};
	export let onToggleFilter: (filterId: string) => void = () => {};
	export let onToggleFeature: (featureId: IntegrationFeatureId) => void = () => {};
	export let onShowValves: (target: ValveTarget) => void = () => {};

	$: sortedFilters = [...toggleFilters].sort((left, right) =>
		left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
	);
</script>

<div
	class="max-h-72 overflow-y-auto overflow-x-hidden scrollbar-thin"
	in:fly={{ x: -20, duration: 150 }}
>
	{#if useModelDefaults && showModelDefaultOption}
		<button
			class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
			aria-pressed={inherited}
			on:click={onDefault}
		>
			<div class="truncate">{$i18n.t('Default')}</div>
			<div class="shrink-0" inert><Switch state={inherited} /></div>
		</button>
	{/if}

	{#if tools}
		{#if Object.keys(tools).length > 0}
			<button
				class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
				on:click={onOpenTools}
			>
				<Wrench />
				<div class="flex w-full items-center justify-between">
					<div class="line-clamp-1">
						{$i18n.t('Tools')}
						<span class="ml-0.5 text-gray-500">{Object.keys(tools).length}</span>
					</div>
					<div class="text-gray-500"><ChevronRight /></div>
				</div>
			</button>
		{/if}

		{#if showSkills && skills && Object.keys(skills).length > 0}
			<button
				class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
				on:click={onOpenSkills}
			>
				<Cube className="size-3.5" strokeWidth="1.75" />
				<div class="flex w-full items-center justify-between">
					<div class="line-clamp-1">
						{$i18n.t('Skills')}
						<span class="ml-0.5 text-gray-500">{Object.keys(skills).length}</span>
					</div>
					<div class="text-gray-500"><ChevronRight /></div>
				</div>
			</button>
		{/if}
	{:else}
		<div class="py-4"><Spinner /></div>
	{/if}

	{#each sortedFilters as filter (filter.id)}
		<Tooltip content={filter.description} placement="top-start">
			<button
				class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
				aria-pressed={selectedFilterIds.includes(filter.id)}
				on:click={() => onToggleFilter(filter.id)}
			>
				<div class="flex-1 truncate">
					<div class="flex flex-1 items-center gap-2">
						<div class="shrink-0">
							{#if filter.icon}
								<div class="flex size-3.5 items-center justify-center">
									<img
										src={filter.icon}
										class="size-3.5 {filter.icon.includes('data:image/svg')
											? 'dark:invert-[80%]'
											: ''}"
										style="fill: currentColor;"
										alt={filter.name}
									/>
								</div>
							{:else}
								<Sparkles className="size-3.5" strokeWidth="1.75" />
							{/if}
						</div>
						<div class="truncate">{filter.name}</div>
					</div>
				</div>
				{#if filter.has_user_valves && showFilterValves}
					<div class="shrink-0">
						<Tooltip content={$i18n.t('Valves')}>
							<button
								class="w-fit self-center rounded-full text-sm text-gray-600 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								type="button"
								on:click={(event) => {
									event.stopPropagation();
									event.preventDefault();
									onShowValves({ type: 'function', id: filter.id });
								}}
							>
								<Knobs />
							</button>
						</Tooltip>
					</div>
				{/if}
				<div class="shrink-0" inert><Switch state={selectedFilterIds.includes(filter.id)} /></div>
			</button>
		</Tooltip>
	{/each}

	{#if webSearchVisible}
		<Tooltip content={$i18n.t('Search the internet')} placement="top-start">
			<button
				class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
				aria-pressed={webSearchEnabled}
				on:click={() => onToggleFeature('web_search')}
			>
				<div class="flex-1 truncate">
					<div class="flex flex-1 items-center gap-2">
						<GlobeAlt />
						<div class="truncate">{$i18n.t('Web Search')}</div>
					</div>
				</div>
				<div class="shrink-0" inert><Switch state={webSearchEnabled} /></div>
			</button>
		</Tooltip>
	{/if}

	{#if imageGenerationVisible}
		<Tooltip content={$i18n.t('Generate an image')} placement="top-start">
			<button
				class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
				aria-pressed={imageGenerationEnabled}
				on:click={() => onToggleFeature('image_generation')}
			>
				<div class="flex-1 truncate">
					<div class="flex flex-1 items-center gap-2">
						<Photo className="size-3.5" strokeWidth="1.5" />
						<div class="truncate">{$i18n.t('Image')}</div>
					</div>
				</div>
				<div class="shrink-0" inert><Switch state={imageGenerationEnabled} /></div>
			</button>
		</Tooltip>
	{/if}

	{#if showCodeInterpreterButton}
		<Tooltip content={$i18n.t('Execute code for analysis')} placement="top-start">
			<button
				class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
				aria-pressed={codeInterpreterEnabled}
				on:click={() => (codeInterpreterEnabled = !codeInterpreterEnabled)}
			>
				<div class="flex-1 truncate">
					<div class="flex flex-1 items-center gap-2">
						<Terminal className="size-3.5" strokeWidth="1.75" />
						<div class="truncate">{$i18n.t('Code Interpreter')}</div>
					</div>
				</div>
				<div class="shrink-0" inert><Switch state={codeInterpreterEnabled} /></div>
			</button>
		</Tooltip>
	{/if}
</div>
