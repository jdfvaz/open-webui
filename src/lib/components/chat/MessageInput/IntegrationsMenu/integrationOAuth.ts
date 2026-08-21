import { deleteOAuthSession } from '$lib/apis/auths';
import { initiateOAuthRedirect } from '$lib/apis/configs';
import { getTools } from '$lib/apis/tools';

const parseToolServerId = (
	toolId: string
): { readonly serverId: string; readonly parts: string[] } => {
	const parts = toolId.split(':');
	return { serverId: parts.at(-1) ?? toolId, parts };
};

export const startIntegrationOAuth = (toolId: string): void => {
	const { serverId, parts } = parseToolServerId(toolId);
	initiateOAuthRedirect({
		id: toolId,
		serverId,
		authType: parts.length > 1 ? (parts[0] === 'server' ? parts[1] : parts[0]) : null
	});
};

export const disconnectIntegrationOAuth = async (token: string, toolId: string) => {
	const { serverId } = parseToolServerId(toolId);
	await deleteOAuthSession(token, `mcp:${serverId}`);
	return await getTools(token);
};
