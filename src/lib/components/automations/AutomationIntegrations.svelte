<script lang="ts">
	import { getContext } from 'svelte';
	import type i18nType from '$lib/i18n';
	import type { AutomationFeatureId } from '$lib/apis/automations';
	import { initiateOAuthRedirect } from '$lib/apis/configs';
	import IntegrationsMenu from '$lib/components/chat/MessageInput/IntegrationsMenu.svelte';
	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import DropdownMenu from '$lib/components/common/DropdownMenu.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Component from '$lib/components/icons/Component.svelte';

	const i18n: typeof i18nType = getContext('i18n');
	export let modelId = '';
	export let toolIds: string[] | null = null;
	export let skillIds: string[] | null = null;
	export let filterIds: string[] | null = null;
	export let featureIds: AutomationFeatureId[] | null = null;
	let show = false;
	let tab = '';
	$: if (!show) tab = '';
</script>

<Dropdown
	bind:show
	side="top"
	align="start"
	visualViewportAware
	maxHeight="18rem"
	contentClass="flex flex-col overflow-hidden!"
>
	<Tooltip content={$i18n.t('Integrations')}>
		<button
			type="button"
			class="flex size-[1.875rem] shrink-0 items-center justify-center rounded-full bg-transparent text-gray-700 outline-hidden transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-white dark:hover:bg-gray-800"
			aria-label={$i18n.t('Integrations')}
		>
			<Component className="size-4.5" strokeWidth="1.5" />
		</button>
	</Tooltip>
	<div slot="content" class="flex min-h-0 flex-col">
		<DropdownMenu
			className="w-70 min-h-0 transition {tab
				? 'flex flex-col overflow-hidden'
				: 'overflow-y-auto overflow-x-hidden scrollbar-thin'}"
		>
			<IntegrationsMenu
				bind:show
				bind:tab
				bind:selectedToolIds={toolIds}
				bind:selectedSkillIds={skillIds}
				bind:selectedFilterIds={filterIds}
				bind:selectedFeatureIds={featureIds}
				selectedModels={modelId ? [modelId] : []}
				useModelDefaults
				showDirectServerTools={false}
				showTerminalSkills={false}
				preserveUnavailableSelections
				showToolValves={false}
				showFilterValves={false}
				showSeparator={false}
				oauthRedirectHandler={initiateOAuthRedirect}
			/>
		</DropdownMenu>
	</div>
</Dropdown>
