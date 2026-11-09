<script lang="ts">
	import { resolveLocalizedResource, resolveLocalizedFunction } from '$lib/utils/localizedContent';
	import { functions as localizedFunctions } from '$lib/stores';
	import { getContext, onDestroy, onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';

	import {
		chatId,
		config,
		models,
		selectedTerminalId,
		settings,
		terminalServers,
		terminalSkills,
		user,
		tools as _tools,
		skills as _skills,
		toolServers
	} from '$lib/stores';

	import { deleteOAuthSession } from '$lib/apis/auths';
	import { getTools } from '$lib/apis/tools';
	import { getSkills } from '$lib/apis/skills';
	import {
		listTerminalSkills,
		resolveTerminalConnection,
		type TerminalSkill
	} from '$lib/apis/terminal';

	import { toast } from 'svelte-sonner';

	import Knobs from '$lib/components/icons/Knobs.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Switch from '$lib/components/common/Switch.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import SearchInput from './InputMenu/SearchInput.svelte';
	import Wrench from '$lib/components/icons/Wrench.svelte';
	import Cube from '$lib/components/icons/Cube.svelte';
	import Sparkles from '$lib/components/icons/Sparkles.svelte';
	import GlobeAlt from '$lib/components/icons/GlobeAlt.svelte';
	import Photo from '$lib/components/icons/Photo.svelte';
	import Terminal from '$lib/components/icons/Terminal.svelte';
	import ChevronRight from '$lib/components/icons/ChevronRight.svelte';
	import ChevronLeft from '$lib/components/icons/ChevronLeft.svelte';
	import LinkSlash from '$lib/components/icons/LinkSlash.svelte';

	import type i18nType from '$lib/i18n';
	import { resolveIntegrationFeatureView } from './IntegrationsMenu/integrationFeatureView';
	import { resolveVisibleToggleFilters } from './IntegrationsMenu/visibleToggleFilters';
	import {
		parseModelIntegrationDefaults,
		resolveIntegrationSelectionView,
		toggleIntegrationTool,
		toggleIntegrationSkill,
		toggleIntegrationFilter,
		toggleIntegrationFeature,
		type IntegrationFeatureId,
		type IntegrationSelection
	} from './integrationSelection';

	const i18n: typeof i18nType = getContext('i18n');

	type IntegrationItem = {
		id: string;
		name: string;
		description?: string;
		meta?: { description?: string };
		is_active?: boolean;
		authenticated?: boolean;
		has_user_valves?: boolean;
		[key: string]: any;
	};

	export let selectedToolIds: string[] | null = [];
	export let selectedSkillIds: string[] | null = [];

	export let selectedModels: string[] = [];
	export let fileUploadCapableModels: string[] = [];
	export let oauthRedirectHandler: Function = () => {};

	export let toggleFilters: {
		id: string;
		name: string;
		description?: string;
		icon?: string;
		has_user_valves?: boolean;
	}[] = [];
	export let selectedFilterIds: string[] | null = [];

	export let showWebSearchButton = false;
	export let webSearchEnabled = false;
	export let showImageGenerationButton = false;
	export let imageGenerationEnabled = false;
	export let showCodeInterpreterButton = false;
	export let codeInterpreterEnabled = false;

	export let onShowValves: Function = () => {};
	export let onWebSearchToggle: Function = () => {};

	export let show = false;
	export let tab = '';

	export let selectedFeatureIds: IntegrationFeatureId[] | null = [];
	export let useModelDefaults = false;
	export let showDirectServerTools = true;
	export let showTerminalSkills = true;
	export let preserveUnavailableSelections = false;
	export let showToolValves = true;
	export let showFilterValves = true;
	export let showSeparator = true;

	$: selectedModel =
		selectedModels.length === 1 ? $models.find((model) => model.id === selectedModels[0]) : null;
	$: modelDefaults = parseModelIntegrationDefaults(selectedModel?.info?.meta);
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
	$: visibleToggleFilters = resolveVisibleToggleFilters(
		useModelDefaults &&
			selectedModel &&
			'filters' in selectedModel &&
			Array.isArray(selectedModel.filters)
			? selectedModel.filters
			: toggleFilters,
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
		effectiveIds: selectionView.effective.featureIds,
		explicitlyEnabled: { web_search: webSearchEnabled, image_generation: imageGenerationEnabled }
	});

	const applySelection = (updated: IntegrationSelection) => {
		selectedToolIds = updated.toolIds;
		selectedSkillIds = updated.skillIds;
		selectedFilterIds = updated.filterIds;
		selectedFeatureIds = updated.featureIds;
	};

	const toggleFilter = (id: string) => {
		if (useModelDefaults) {
			applySelection(toggleIntegrationFilter(selectionState, modelDefaults, id));
		} else {
			selectedFilterIds = effectiveFilterIds.includes(id)
				? effectiveFilterIds.filter((selected) => selected !== id)
				: [...effectiveFilterIds, id];
		}
	};

	const toggleFeature = (id: IntegrationFeatureId) => {
		if (useModelDefaults) {
			applySelection(toggleIntegrationFeature(selectionState, modelDefaults, id));
		} else if (id === 'web_search') {
			webSearchEnabled = !webSearchEnabled;
			if (webSearchEnabled && $config?.features?.enable_web_search_confirmation) show = false;
			onWebSearchToggle(webSearchEnabled);
		} else {
			imageGenerationEnabled = !imageGenerationEnabled;
		}
	};

	let tools: Record<string, IntegrationItem> | null = null;
	let skills: Record<string, IntegrationItem> | null = null;
	let toolQuery = '';
	let skillQuery = '';
	let searchedToolQuery = '';
	let searchedSkillQuery = '';
	let toolSearchDebounceTimer: ReturnType<typeof setTimeout>;
	let skillSearchDebounceTimer: ReturnType<typeof setTimeout>;
	let toolRequestId = 0;
	let skillRequestId = 0;

	$: toolIds = Object.keys(tools ?? {});
	$: skillIds = Object.keys(skills ?? {});

	$: if (show && toolQuery !== searchedToolQuery) {
		scheduleToolSearch();
	}

	$: if (show && skillQuery !== searchedSkillQuery) {
		scheduleSkillSearch();
	}

	// This content mounts already open; initialize after the derived lists have been set up.
	onMount(() => {
		void init();
	});

	let fileUploadEnabled = true;
	$: fileUploadEnabled =
		fileUploadCapableModels.length === selectedModels.length &&
		($user?.role === 'admin' || $user?.permissions?.chat?.file_upload);

	const init = async () => {
		await Promise.all([loadTools(), loadSkills()]);
	};

	const setTools = (toolItems: IntegrationItem[] | null, query = '') => {
		const q = query.trim().toLowerCase();
		const items = (toolItems ?? [])
			.filter(
				(tool) =>
					!q ||
					`${tool.name} ${resolveLocalizedResource(tool, $i18n.language)} ${resolveLocalizedResource(tool, $i18n.language, 'description')}`
						.toLowerCase()
						.includes(q)
			)
			.reduce<Record<string, IntegrationItem>>((a, tool) => {
				a[tool.id] = {
					...tool,
					name: tool.name,
					description: tool.meta?.description
				};
				return a;
			}, {});

		for (const serverIdx in (showDirectServerTools ? ($toolServers ?? []) : []) as any[]) {
			const server = (($toolServers ?? []) as any[])[serverIdx];
			if (server.info) {
				const name = server?.info?.title ?? server.url;
				if (q && !name.toLowerCase().includes(q)) {
					continue;
				}

				items[`direct_server:${serverIdx}`] = {
					id: `direct_server:${serverIdx}`,
					name,
					description: server.info.description ?? ''
				};
			}
		}

		if (preserveUnavailableSelections) {
			for (const id of effectiveToolIds) {
				if (!q || id.toLowerCase().includes(q)) items[id] ??= { id, name: id };
			}
		}
		tools = items;

		if (!q && !preserveUnavailableSelections && selectedToolIds !== null) {
			selectedToolIds = selectedToolIds.filter((id) => Object.keys(tools ?? {}).includes(id));
		}
	};

	const setSkills = (skillItems: IntegrationItem[] | null, query = '') => {
		skills = (skillItems ?? [])
			.filter(
				(skill) =>
					skill.is_active &&
					(!query.trim() ||
						`${skill.name} ${resolveLocalizedResource(skill, $i18n.language)} ${resolveLocalizedResource(skill, $i18n.language, 'description')}`
							.toLowerCase()
							.includes(query.trim().toLowerCase()))
			)
			.reduce<Record<string, IntegrationItem>>((a, skill) => {
				a[skill.id] = {
					...skill,
					name: skill.name,
					description: skill.description
				};
				return a;
			}, {});

		if (preserveUnavailableSelections) {
			for (const id of effectiveSkillIds) {
				if (!query.trim() || id.toLowerCase().includes(query.trim().toLowerCase()))
					skills[id] ??= { id, name: id };
			}
		}
		if (!query.trim() && !preserveUnavailableSelections && selectedSkillIds !== null) {
			selectedSkillIds = selectedSkillIds.filter((id) => Object.keys(skills ?? {}).includes(id));
		}
	};

	const getTerminalSkillItems = async (): Promise<TerminalSkill[]> => {
		const connection = resolveTerminalConnection(
			$selectedTerminalId,
			$terminalServers ?? [],
			$settings?.terminalServers ?? [],
			localStorage.token
		);
		const items = await listTerminalSkills(connection, $chatId || null).catch(() => []);
		terminalSkills.set(items);
		return items;
	};

	const loadTools = async (query = toolQuery) => {
		const requestId = ++toolRequestId;
		const q = query.trim();
		searchedToolQuery = query;

		if ($_tools === null) {
			await _tools.set(await getTools(localStorage.token));
		}
		if (requestId !== toolRequestId) return;
		setTools($_tools, q);
	};

	const loadSkills = async (query = skillQuery) => {
		const requestId = ++skillRequestId;
		const q = query.trim();
		searchedSkillQuery = query;

		if ($_skills === null) {
			await _skills.set(await getSkills(localStorage.token));
		}
		if (requestId !== skillRequestId) return;
		const terminalItems = showTerminalSkills ? await getTerminalSkillItems() : [];
		if (requestId !== skillRequestId) return;
		setSkills([...($_skills ?? []), ...terminalItems], q);
	};

	const scheduleToolSearch = () => {
		clearTimeout(toolSearchDebounceTimer);
		toolSearchDebounceTimer = setTimeout(() => {
			loadTools();
		}, 200);
	};

	const scheduleSkillSearch = () => {
		clearTimeout(skillSearchDebounceTimer);
		skillSearchDebounceTimer = setTimeout(() => {
			loadSkills();
		}, 200);
	};

	const toggleTool = async (toolId: string, e: MouseEvent) => {
		const tool = tools?.[toolId];
		if (!tool) return;

		if (!(tool.authenticated ?? true)) {
			e.preventDefault();

			const parts = toolId.split(':');
			oauthRedirectHandler({
				id: toolId,
				serverId: parts.at(-1) ?? toolId,
				authType: parts.length > 1 ? (parts[0] === 'server' ? parts[1] : parts[0]) : null
			});
			return;
		}

		if (useModelDefaults) {
			applySelection(toggleIntegrationTool(selectionState, modelDefaults, toolId));
			return;
		}
		const state = !effectiveToolIds.includes(toolId);
		await tick();

		if (state) {
			selectedToolIds = [...effectiveToolIds, toolId];
		} else {
			selectedToolIds = effectiveToolIds.filter((id) => id !== toolId);
		}
	};

	const toggleSkill = async (skillId: string) => {
		const skill = skills?.[skillId];
		if (!skill) return;

		if (useModelDefaults) {
			applySelection(toggleIntegrationSkill(selectionState, modelDefaults, skillId));
			return;
		}
		const state = !effectiveSkillIds.includes(skillId);
		await tick();

		if (state) {
			selectedSkillIds = [...effectiveSkillIds, skillId];
		} else {
			selectedSkillIds = effectiveSkillIds.filter((id) => id !== skillId);
		}
	};

	const skillSourceLabel = (skill: IntegrationItem | undefined) =>
		skill?.source === 'terminal' ? $i18n.t('Terminal') : '';

	onDestroy(() => {
		clearTimeout(toolSearchDebounceTimer);
		clearTimeout(skillSearchDebounceTimer);
	});
</script>

{#if tab === ''}
	{#if showSeparator}<div class="h-px mx-1 my-1 bg-gray-100 dark:bg-gray-800"></div>{/if}
	<div in:fly={{ x: -20, duration: 150 }}>
		{#if tools}
			{#if Object.keys(tools).length > 0}
				<button
					role="menuitem"
					class="flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
					on:click={() => {
						tab = 'tools';
					}}
				>
					<Wrench />

					<div class="flex items-center w-full justify-between">
						<div class=" line-clamp-1">
							{$i18n.t('Tools')}
							<span class="ml-0.5 text-gray-500">{Object.keys(tools).length}</span>
						</div>

						<div class="flex shrink-0 items-center gap-2 text-gray-500">
							{#if effectiveToolIds.length > 0}
								<span class="text-xs">
									{$i18n.t('{{COUNT}} selected', { COUNT: effectiveToolIds.length })}
								</span>
							{/if}
							<ChevronRight />
						</div>
					</div>
				</button>
			{/if}

			{#if skills && Object.keys(skills).length > 0}
				<button
					role="menuitem"
					class="flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
					on:click={() => {
						tab = 'skills';
					}}
				>
					<Cube className="size-3.5" strokeWidth="1.75" />

					<div class="flex items-center w-full justify-between">
						<div class=" line-clamp-1">
							{$i18n.t('Skills')}
							<span class="ml-0.5 text-gray-500">{Object.keys(skills).length}</span>
						</div>

						<div class="flex shrink-0 items-center gap-2 text-gray-500">
							{#if effectiveSkillIds.length > 0}
								<span class="text-xs">
									{$i18n.t('{{COUNT}} selected', { COUNT: effectiveSkillIds.length })}
								</span>
							{/if}
							<ChevronRight />
						</div>
					</div>
				</button>
			{/if}
		{:else}
			<div class="py-4">
				<Spinner />
			</div>
		{/if}

		{#if visibleToggleFilters && visibleToggleFilters.length > 0}
			{#each visibleToggleFilters.sort( (a, b) => a.name.localeCompare( b.name, undefined, { sensitivity: 'base' } ) ) as filter, filterIdx (filter.id)}
				<Tooltip
					content={resolveLocalizedFunction(
						filter,
						$localizedFunctions,
						$i18n.language,
						'description'
					)}
					placement="top-start"
				>
					<div
						class="flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40 has-[[role^=menuitem]:focus-visible]:outline-2 has-[[role^=menuitem]:focus-visible]:-outline-offset-2 has-[[role^=menuitem]:focus-visible]:outline-blue-500"
						role="presentation"
						on:click={() => toggleFilter(filter.id)}
					>
						<button
							type="button"
							class="flex-1 truncate text-left cursor-pointer focus-visible:outline-none!"
							role="menuitemcheckbox"
							aria-checked={effectiveFilterIds.includes(filter.id)}
						>
							<div class="flex flex-1 gap-2 items-center">
								<div class="shrink-0">
									{#if filter?.icon}
										<div class="size-3.5 items-center flex justify-center">
											<img
												src={filter.icon}
												class="size-3.5 {filter.icon.includes('data:image/svg')
													? 'dark:invert-[80%]'
													: ''}"
												style="fill: currentColor;"
												alt={resolveLocalizedFunction(filter, $localizedFunctions, $i18n.language)}
											/>
										</div>
									{:else}
										<Sparkles className="size-3.5" strokeWidth="1.75" />
									{/if}
								</div>

								<div class=" truncate">
									{resolveLocalizedFunction(filter, $localizedFunctions, $i18n.language)}
								</div>
							</div>
						</button>

						{#if showFilterValves && filter?.has_user_valves && ($user?.role === 'admin' || ($user?.permissions?.chat?.valves ?? true))}
							<div class=" shrink-0">
								<Tooltip content={$i18n.t('Valves')}>
									<button
										aria-label={$i18n.t('Valves')}
										class="self-center w-fit text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition rounded-full"
										type="button"
										on:click={(e) => {
											e.stopPropagation();
											e.preventDefault();
											onShowValves({
												type: 'function',
												id: filter.id
											});
										}}
									>
										<Knobs />
									</button>
								</Tooltip>
							</div>
						{/if}

						<div class=" shrink-0" inert>
							<Switch state={effectiveFilterIds.includes(filter.id)} />
						</div>
					</div>
				</Tooltip>
			{/each}
		{/if}

		{#if featureView.webSearchVisible}
			<Tooltip content={$i18n.t('Search the internet')} placement="top-start">
				<button
					class="flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
					role="menuitemcheckbox"
					aria-checked={featureView.webSearchEnabled}
					on:click={() => toggleFeature('web_search')}
				>
					<div class="flex-1 truncate">
						<div class="flex flex-1 gap-2 items-center">
							<div class="shrink-0">
								<GlobeAlt className="size-3.5" strokeWidth="1.5" />
							</div>

							<div class=" truncate">{$i18n.t('Web Search')}</div>
						</div>
					</div>

					<div class=" shrink-0" inert>
						<Switch state={featureView.webSearchEnabled} />
					</div>
				</button>
			</Tooltip>
		{/if}

		{#if featureView.imageGenerationVisible}
			<Tooltip content={$i18n.t('Generate an image')} placement="top-start">
				<button
					class="flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
					role="menuitemcheckbox"
					aria-checked={featureView.imageGenerationEnabled}
					on:click={() => toggleFeature('image_generation')}
				>
					<div class="flex-1 truncate">
						<div class="flex flex-1 gap-2 items-center">
							<div class="shrink-0">
								<Photo className="size-3.5" strokeWidth="1.5" />
							</div>

							<div class=" truncate">{$i18n.t('Image')}</div>
						</div>
					</div>

					<div class=" shrink-0" inert>
						<Switch state={featureView.imageGenerationEnabled} />
					</div>
				</button>
			</Tooltip>
		{/if}

		{#if showCodeInterpreterButton}
			<Tooltip content={$i18n.t('Execute code for analysis')} placement="top-start">
				<button
					class="flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
					role="menuitemcheckbox"
					aria-checked={codeInterpreterEnabled}
					on:click={() => {
						codeInterpreterEnabled = !codeInterpreterEnabled;
					}}
				>
					<div class="flex-1 truncate">
						<div class="flex flex-1 gap-2 items-center">
							<div class="shrink-0">
								<Terminal className="size-3.5" strokeWidth="1.75" />
							</div>

							<div class=" truncate">{$i18n.t('Code Interpreter')}</div>
						</div>
					</div>

					<div class=" shrink-0" inert>
						<Switch state={codeInterpreterEnabled} />
					</div>
				</button>
			</Tooltip>
		{/if}
	</div>
{:else if tab === 'tools' && tools}
	<div class="flex min-h-0 flex-col gap-0.5 overflow-hidden" in:fly={{ x: 20, duration: 150 }}>
		<button
			role="menuitem"
			class="flex w-full shrink-0 justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
			on:click={() => {
				toolQuery = '';
				tab = '';
			}}
		>
			<ChevronLeft />

			<div class="flex items-center w-full justify-between">
				<div>
					{$i18n.t('Tools')}
					<span class="ml-0.5 text-gray-500">{toolIds.length}</span>
				</div>
			</div>
		</button>

		<SearchInput bind:value={toolQuery} placeholder={$i18n.t('Search tools')} />

		<div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
			{#if toolIds.length === 0}
				<div class="text-center text-xs text-gray-500 py-3">{$i18n.t('No tools found')}</div>
			{:else}
				<div class="flex flex-col gap-0.5">
					{#each toolIds as toolId}
						<div
							class="relative flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40 has-[[role^=menuitem]:focus-visible]:outline-2 has-[[role^=menuitem]:focus-visible]:-outline-offset-2 has-[[role^=menuitem]:focus-visible]:outline-blue-500"
							role="presentation"
							on:click={async (e) => {
								await toggleTool(toolId, e);
							}}
						>
							{#if !(tools?.[toolId]?.authenticated ?? true)}
								<!-- make it slighly darker and not clickable -->
								<div class="absolute inset-0 opacity-50 rounded-xl cursor-pointer z-10"></div>
							{/if}
							<button
								type="button"
								class="flex-1 truncate text-left cursor-pointer focus-visible:outline-none!"
								role={(tools?.[toolId]?.authenticated ?? true) ? 'menuitemcheckbox' : 'menuitem'}
								aria-checked={(tools?.[toolId]?.authenticated ?? true)
									? effectiveToolIds.includes(toolId)
									: undefined}
							>
								<div class="flex flex-1 gap-2 items-center">
									<Tooltip
										content={resolveLocalizedResource(tools?.[toolId], $i18n.language, 'name')}
										placement="top"
									>
										<div class="shrink-0">
											<Wrench />
										</div>
									</Tooltip>
									<Tooltip
										content={resolveLocalizedResource(
											tools?.[toolId],
											$i18n.language,
											'description'
										)}
										placement="top-start"
									>
										<div class=" truncate">
											{resolveLocalizedResource(tools?.[toolId], $i18n.language, 'name')}
										</div>
									</Tooltip>
								</div>
							</button>

							{#if tools?.[toolId]?.authenticated === true && toolId.startsWith('server:mcp:')}
								<div class="shrink-0">
									<Tooltip content={$i18n.t('Disconnect OAuth')}>
										<button
											aria-label={$i18n.t('Disconnect OAuth')}
											class="self-center w-fit text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition rounded-full"
											type="button"
											on:click={async (e) => {
												e.stopPropagation();
												e.preventDefault();

												const parts = toolId.split(':');
												const serverId = parts.at(-1) ?? toolId;
												const provider = `mcp:${serverId}`;

												try {
													await deleteOAuthSession(localStorage.token, provider);
													toast.success($i18n.t('OAuth session disconnected'));

													// Refresh tools to update authenticated state
													_tools.set(await getTools(localStorage.token));
													selectedToolIds = effectiveToolIds.filter((id) => id !== toolId);
													await init();
												} catch (err) {
													toast.error(String(err ?? $i18n.t('Failed to disconnect')));
												}
											}}
										>
											<LinkSlash className="size-3.5" />
										</button>
									</Tooltip>
								</div>
							{/if}

							{#if showToolValves && tools?.[toolId]?.has_user_valves && ($user?.role === 'admin' || ($user?.permissions?.chat?.valves ?? true))}
								<div class=" shrink-0">
									<Tooltip content={$i18n.t('Valves')}>
										<button
											aria-label={$i18n.t('Valves')}
											class="self-center w-fit text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition rounded-full"
											type="button"
											on:click={(e) => {
												e.stopPropagation();
												e.preventDefault();
												onShowValves({
													type: 'tool',
													id: toolId
												});
											}}
										>
											<Knobs />
										</button>
									</Tooltip>
								</div>
							{/if}

							<div class=" shrink-0" inert>
								<Switch state={effectiveToolIds.includes(toolId)} />
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{:else if tab === 'skills' && skills}
	<div class="flex min-h-0 flex-col gap-0.5 overflow-hidden" in:fly={{ x: 20, duration: 150 }}>
		<button
			role="menuitem"
			class="flex w-full shrink-0 justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
			on:click={() => {
				skillQuery = '';
				tab = '';
			}}
		>
			<ChevronLeft />

			<div class="flex items-center w-full justify-between">
				<div>
					{$i18n.t('Skills')}
					<span class="ml-0.5 text-gray-500">{skillIds.length}</span>
				</div>
			</div>
		</button>

		<SearchInput bind:value={skillQuery} placeholder={$i18n.t('Search skills')} />

		<div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
			{#if skillIds.length === 0}
				<div class="text-center text-xs text-gray-500 py-3">{$i18n.t('No skills found')}</div>
			{:else}
				<div class="flex flex-col gap-0.5">
					{#each skillIds as skillId}
						<button
							class="relative flex w-full justify-between gap-2 items-center h-[1.6875rem] px-2 text-[0.8125rem] font-normal cursor-pointer rounded-xl hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
							role="menuitemcheckbox"
							aria-checked={effectiveSkillIds.includes(skillId)}
							on:click={async () => {
								await toggleSkill(skillId);
							}}
						>
							<div class="flex-1 truncate">
								<div class="flex flex-1 gap-2 items-center">
									<Tooltip
										content={resolveLocalizedResource(skills?.[skillId], $i18n.language, 'name')}
										placement="top"
									>
										<div class="shrink-0">
											<Cube className="size-3.5" strokeWidth="1.75" />
										</div>
									</Tooltip>
									<Tooltip
										content={resolveLocalizedResource(
											skills?.[skillId],
											$i18n.language,
											'description'
										)}
										placement="top-start"
									>
										<div class=" truncate">
											{resolveLocalizedResource(skills?.[skillId], $i18n.language, 'name')}
										</div>
									</Tooltip>
									{#if skillSourceLabel(skills?.[skillId])}
										<div class="shrink-0 text-[0.6875rem] text-gray-500 dark:text-gray-400">
											{skillSourceLabel(skills?.[skillId])}
										</div>
									{/if}
								</div>
							</div>

							<div class=" shrink-0" inert>
								<Switch state={effectiveSkillIds.includes(skillId)} />
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
