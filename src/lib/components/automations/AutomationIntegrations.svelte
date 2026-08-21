<script lang="ts">
	import { getContext } from 'svelte';
	import type i18nType from '$lib/i18n';
	import type { AutomationFeatureId } from '$lib/apis/automations';

	import IntegrationsMenu from '$lib/components/chat/MessageInput/IntegrationsMenu.svelte';
	import Component from '$lib/components/icons/Component.svelte';

	const i18n: typeof i18nType = getContext('i18n');

	export let modelId = '';
	export let toolIds: string[] | null = null;
	export let skillIds: string[] | null = null;
	export let filterIds: string[] | null = null;
	export let featureIds: AutomationFeatureId[] | null = null;
</script>

<IntegrationsMenu
	bind:selectedToolIds={toolIds}
	bind:selectedSkillIds={skillIds}
	bind:selectedFilterIds={filterIds}
	bind:selectedFeatureIds={featureIds}
	selectedModels={modelId ? [modelId] : []}
	useModelDefaults
	showModelDefaultOption={false}
	showDirectServerTools={false}
	preserveUnavailableSelections
	showToolValves={false}
	showFilterValves={false}
	side="top"
	align="start"
	contentRole="dialog"
	contentAriaLabel={$i18n.t('Integrations')}
>
	<button
		type="button"
		class="flex size-[1.875rem] shrink-0 items-center justify-center rounded-full bg-transparent text-gray-700 outline-hidden transition hover:bg-gray-100 focus:outline-hidden dark:text-white dark:hover:bg-gray-800"
		aria-label={$i18n.t('Integrations')}
	>
		<Component className="size-4.5" strokeWidth="1.5" />
	</button>
</IntegrationsMenu>
