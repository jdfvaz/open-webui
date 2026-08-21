export type IntegrationItem = {
	readonly id: string;
	readonly name: string;
	readonly description?: string;
	readonly meta?: { readonly description?: string };
	readonly is_active?: boolean;
	readonly authenticated?: boolean;
	readonly has_user_valves?: boolean;
};

export type ToggleFilter = {
	readonly id: string;
	readonly name: string;
	readonly description?: string;
	readonly icon?: string;
	readonly has_user_valves?: boolean;
};

export type ValveTarget = { readonly type: 'function' | 'tool'; readonly id: string };
