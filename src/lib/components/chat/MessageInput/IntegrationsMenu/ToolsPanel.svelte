<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import type i18nType from '$lib/i18n';

	import ChevronLeft from '$lib/components/icons/ChevronLeft.svelte';
	import Knobs from '$lib/components/icons/Knobs.svelte';
	import LinkSlash from '$lib/components/icons/LinkSlash.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Wrench from '$lib/components/icons/Wrench.svelte';
	import SearchInput from '../InputMenu/SearchInput.svelte';

	type ToolItem = {
		readonly id: string;
		readonly name?: string;
		readonly description?: string;
		readonly authenticated?: boolean;
		readonly has_user_valves?: boolean;
	};

	type ValveTarget = { readonly type: 'tool'; readonly id: string };

	const i18n: typeof i18nType = getContext('i18n');

	export let tools: Record<string, ToolItem> = {};
	export let toolIds: string[] = [];
	export let selectedToolIds: string[] = [];
	export let toolQuery = '';
	export let onBack: () => void = () => {};
	export let onToggle: (toolId: string, event: MouseEvent) => Promise<void> = async () => {};
	export let onDisconnect: (toolId: string) => Promise<void> = async () => {};
	export let onShowValves: (target: ValveTarget) => void = () => {};
	export let showValves = false;
</script>

<div class="flex max-h-72 min-h-0 flex-col gap-0.5" in:fly={{ x: 20, duration: 150 }}>
	<button
		class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
		on:click={onBack}
	>
		<ChevronLeft />
		<div class="flex w-full items-center justify-between">
			<div>
				{$i18n.t('Tools')}
				<span class="ml-0.5 text-gray-500">{toolIds.length}</span>
			</div>
		</div>
	</button>

	<SearchInput bind:value={toolQuery} placeholder={$i18n.t('Search tools')} />

	<div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
		{#if toolIds.length === 0}
			<div class="py-3 text-center text-xs text-gray-500">{$i18n.t('No tools found')}</div>
		{:else}
			<div class="flex flex-col gap-0.5">
				{#each toolIds as toolId}
					<button
						class="relative flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
						aria-pressed={(tools[toolId]?.authenticated ?? true)
							? selectedToolIds.includes(toolId)
							: undefined}
						on:click={(event) => onToggle(toolId, event)}
					>
						{#if !(tools[toolId]?.authenticated ?? true)}
							<div class="absolute inset-0 z-10 cursor-pointer rounded-xl opacity-50"></div>
						{/if}
						<div class="flex-1 truncate">
							<div class="flex flex-1 items-center gap-2">
								<Tooltip content={tools[toolId]?.name ?? ''} placement="top">
									<div class="shrink-0"><Wrench /></div>
								</Tooltip>
								<Tooltip content={tools[toolId]?.description ?? ''} placement="top-start">
									<div class="truncate">{tools[toolId]?.name}</div>
								</Tooltip>
							</div>
						</div>

						{#if (tools[toolId]?.authenticated ?? true) && toolId.startsWith('server:mcp:')}
							<div class="shrink-0">
								<Tooltip content={$i18n.t('Disconnect OAuth')}>
									<button
										class="w-fit self-center rounded-full text-sm text-gray-600 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
										type="button"
										on:click={async (event) => {
											event.stopPropagation();
											event.preventDefault();
											await onDisconnect(toolId);
										}}
									>
										<LinkSlash className="size-3.5" />
									</button>
								</Tooltip>
							</div>
						{/if}

						{#if tools[toolId]?.has_user_valves && showValves}
							<div class="shrink-0">
								<Tooltip content={$i18n.t('Valves')}>
									<button
										class="w-fit self-center rounded-full text-sm text-gray-600 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
										type="button"
										on:click={(event) => {
											event.stopPropagation();
											event.preventDefault();
											onShowValves({ type: 'tool', id: toolId });
										}}
									>
										<Knobs />
									</button>
								</Tooltip>
							</div>
						{/if}

						<div class="shrink-0" inert>
							<Switch state={selectedToolIds.includes(toolId)} />
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
