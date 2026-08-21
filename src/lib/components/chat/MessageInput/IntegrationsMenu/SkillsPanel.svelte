<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import type i18nType from '$lib/i18n';

	import ChevronLeft from '$lib/components/icons/ChevronLeft.svelte';
	import Cube from '$lib/components/icons/Cube.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import SearchInput from '../InputMenu/SearchInput.svelte';

	type SkillItem = {
		readonly id: string;
		readonly name?: string;
		readonly description?: string;
	};

	const i18n: typeof i18nType = getContext('i18n');

	export let skills: Record<string, SkillItem> = {};
	export let skillIds: string[] = [];
	export let selectedSkillIds: string[] = [];
	export let skillQuery = '';
	export let onBack: () => void = () => {};
	export let onToggle: (skillId: string) => Promise<void> = async () => {};
</script>

<div class="flex max-h-72 min-h-0 flex-col gap-0.5" in:fly={{ x: 20, duration: 150 }}>
	<button
		class="flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
		on:click={onBack}
	>
		<ChevronLeft />
		<div class="flex w-full items-center justify-between">
			<div>
				{$i18n.t('Skills')}
				<span class="ml-0.5 text-gray-500">{skillIds.length}</span>
			</div>
		</div>
	</button>

	<SearchInput bind:value={skillQuery} placeholder={$i18n.t('Search skills')} />

	<div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
		{#if skillIds.length === 0}
			<div class="py-3 text-center text-xs text-gray-500">{$i18n.t('No skills found')}</div>
		{:else}
			<div class="flex flex-col gap-0.5">
				{#each skillIds as skillId}
					<button
						class="relative flex h-[1.6875rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 text-[0.8125rem] font-normal hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
						aria-pressed={selectedSkillIds.includes(skillId)}
						on:click={() => onToggle(skillId)}
					>
						<div class="flex-1 truncate">
							<div class="flex flex-1 items-center gap-2">
								<Tooltip content={skills[skillId]?.name ?? ''} placement="top">
									<div class="shrink-0">
										<Cube className="size-3.5" strokeWidth="1.75" />
									</div>
								</Tooltip>
								<Tooltip content={skills[skillId]?.description ?? ''} placement="top-start">
									<div class="truncate">{skills[skillId]?.name}</div>
								</Tooltip>
							</div>
						</div>
						<div class="shrink-0" inert>
							<Switch state={selectedSkillIds.includes(skillId)} />
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
