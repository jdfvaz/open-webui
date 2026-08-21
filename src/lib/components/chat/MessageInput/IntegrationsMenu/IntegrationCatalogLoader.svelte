<script lang="ts">
	import { onDestroy } from 'svelte';
	import { skills as _skills, toolServers, tools as _tools } from '$lib/stores';
	import { getSkills } from '$lib/apis/skills';
	import { getTools } from '$lib/apis/tools';
	import { mergeVisibleIntegrationIds } from '../integrationSelection';
	import type { IntegrationItem } from './types';

	type DirectToolServer = {
		readonly url?: string;
		readonly info?: { readonly title?: string; readonly description?: string };
	};

	const isDirectToolServer = (value: unknown): value is DirectToolServer =>
		value !== null && typeof value === 'object';

	export let show = false;
	export let showSkills = true;
	export let showDirectServerTools = true;
	export let preserveUnavailableSelections = false;
	export let selectedToolIds: string[] | null = [];
	export let selectedSkillIds: string[] | null = [];
	export let effectiveToolIds: string[] = [];
	export let effectiveSkillIds: string[] = [];
	export let tools: Record<string, IntegrationItem> | null = null;
	export let skills: Record<string, IntegrationItem> | null = null;
	export let toolQuery = '';
	export let skillQuery = '';
	export let reloadToken = 0;

	let searchedToolQuery = '';
	let searchedSkillQuery = '';
	let toolSearchDebounceTimer: ReturnType<typeof setTimeout>;
	let skillSearchDebounceTimer: ReturnType<typeof setTimeout>;
	let toolRequestId = 0;
	let skillRequestId = 0;

	const setTools = (toolItems: IntegrationItem[] | null, query = '') => {
		const normalizedQuery = query.trim().toLowerCase();
		const items = (toolItems ?? []).reduce<Record<string, IntegrationItem>>((result, tool) => {
			result[tool.id] = { ...tool, name: tool.name, description: tool.meta?.description };
			return result;
		}, {});

		if (showDirectServerTools) {
			const directToolServers = Array.isArray($toolServers)
				? $toolServers.filter(isDirectToolServer)
				: [];
			for (const [serverIndex, server] of directToolServers.entries()) {
				if (!server.info) continue;
				const name = server.info.title ?? server.url;
				if (!name || (normalizedQuery && !name.toLowerCase().includes(normalizedQuery))) continue;
				const id = `direct_server:${serverIndex}`;
				items[id] = { id, name, description: server.info.description ?? '' };
			}
		}

		if (preserveUnavailableSelections) {
			for (const toolId of mergeVisibleIntegrationIds(Object.keys(items), effectiveToolIds)) {
				if (normalizedQuery && !toolId.toLowerCase().includes(normalizedQuery)) continue;
				items[toolId] ??= { id: toolId, name: toolId };
			}
		}

		tools = items;
		if (!normalizedQuery && !preserveUnavailableSelections && selectedToolIds !== null) {
			selectedToolIds = selectedToolIds.filter((id) => id in items);
		}
	};

	const setSkills = (skillItems: IntegrationItem[] | null, query = '') => {
		const normalizedQuery = query.trim().toLowerCase();
		const items = (skillItems ?? [])
			.filter((skill) => skill.is_active)
			.reduce<Record<string, IntegrationItem>>((result, skill) => {
				result[skill.id] = { ...skill, name: skill.name, description: skill.description };
				return result;
			}, {});

		if (preserveUnavailableSelections) {
			for (const skillId of mergeVisibleIntegrationIds(Object.keys(items), effectiveSkillIds)) {
				if (normalizedQuery && !skillId.toLowerCase().includes(normalizedQuery)) continue;
				items[skillId] ??= { id: skillId, name: skillId };
			}
		}

		skills = items;
		if (!normalizedQuery && !preserveUnavailableSelections && selectedSkillIds !== null) {
			selectedSkillIds = selectedSkillIds.filter((id) => id in items);
		}
	};

	const loadTools = async (query = toolQuery) => {
		const requestId = ++toolRequestId;
		const normalizedQuery = query.trim();
		searchedToolQuery = query;
		if (normalizedQuery) {
			const toolItems = await getTools(localStorage.token, normalizedQuery).catch(() => []);
			if (requestId === toolRequestId) setTools(toolItems, normalizedQuery);
			return;
		}
		if ($_tools === null) await _tools.set(await getTools(localStorage.token));
		if (requestId === toolRequestId) setTools($_tools);
	};

	const loadSkills = async (query = skillQuery) => {
		const requestId = ++skillRequestId;
		const normalizedQuery = query.trim();
		searchedSkillQuery = query;
		if (normalizedQuery) {
			const skillItems = await getSkills(localStorage.token, normalizedQuery).catch(() => []);
			if (requestId === skillRequestId) setSkills(skillItems, normalizedQuery);
			return;
		}
		if ($_skills === null) await _skills.set(await getSkills(localStorage.token));
		if (requestId === skillRequestId) setSkills($_skills);
	};

	const scheduleToolSearch = () => {
		clearTimeout(toolSearchDebounceTimer);
		toolSearchDebounceTimer = setTimeout(loadTools, 200);
	};

	const scheduleSkillSearch = () => {
		clearTimeout(skillSearchDebounceTimer);
		skillSearchDebounceTimer = setTimeout(loadSkills, 200);
	};

	$: if (show && toolQuery !== searchedToolQuery) scheduleToolSearch();
	$: if (show && showSkills && skillQuery !== searchedSkillQuery) scheduleSkillSearch();
	$: if (show && reloadToken >= 0) {
		Promise.all([loadTools(), showSkills ? loadSkills() : Promise.resolve()]);
	}

	onDestroy(() => {
		clearTimeout(toolSearchDebounceTimer);
		clearTimeout(skillSearchDebounceTimer);
	});
</script>
