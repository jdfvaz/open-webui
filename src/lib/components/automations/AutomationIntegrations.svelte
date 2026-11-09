<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type i18nType from '$lib/i18n';
	import type { AutomationFeatureId } from '$lib/apis/automations';
	import { getOAuthClientAuthorizationUrl, type initiateOAuthRedirect } from '$lib/apis/configs';
	import { getTools } from '$lib/apis/tools';
	import { models, tools } from '$lib/stores';
	import {
		parseModelIntegrationDefaults,
		resolveIntegrationSelection,
		toggleIntegrationTool
	} from '$lib/components/chat/MessageInput/integrationSelection';
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

	let pendingConnection: {
		readonly tool: Parameters<typeof initiateOAuthRedirect>[0];
		readonly modelId: string;
		readonly token: string;
	} | null = null;
	let checkingConnection = false;
	$: if (pendingConnection && pendingConnection.modelId !== modelId) pendingConnection = null;

	const connectTool = (tool: Parameters<typeof initiateOAuthRedirect>[0]) => {
		const popup = window.open('about:blank', '_blank');
		if (!popup) {
			toast.error($i18n.t('Please allow popups to connect your tool.'));
			return;
		}
		popup.opener = null;
		pendingConnection = { tool, modelId, token: localStorage.token };
		popup.location.href = getOAuthClientAuthorizationUrl(tool.serverId, tool.authType ?? 'mcp');
		show = false;
	};

	const checkConnection = async () => {
		const pending = pendingConnection;
		if (!pending || checkingConnection) return;
		if (pending.token !== localStorage.token) {
			pendingConnection = null;
			return;
		}
		checkingConnection = true;
		try {
			const available: { id: string; authenticated?: boolean }[] = await getTools(pending.token);
			if (
				pending !== pendingConnection ||
				pending.modelId !== modelId ||
				pending.token !== localStorage.token
			)
				return;
			tools.set(null);
			if (available.some((tool) => tool.id === pending.tool.id && tool.authenticated === true)) {
				const defaults = parseModelIntegrationDefaults(
					$models.find((model) => model.id === modelId)?.info?.meta
				);
				const selection = { toolIds, skillIds, filterIds, featureIds };
				if (!resolveIntegrationSelection(selection, defaults).toolIds.includes(pending.tool.id)) {
					({ toolIds, skillIds, filterIds, featureIds } = toggleIntegrationTool(
						selection,
						defaults,
						pending.tool.id
					));
				}
				pendingConnection = null;
			}
		} catch (error: unknown) {
			if (pending === pendingConnection && pending.token === localStorage.token) {
				toast.error(`${error}`);
			}
		} finally {
			checkingConnection = false;
		}
	};

	onDestroy(() => {
		pendingConnection = null;
	});
</script>

<svelte:window on:focus={checkConnection} />

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
				oauthRedirectHandler={connectTool}
			/>
		</DropdownMenu>
	</div>
</Dropdown>
