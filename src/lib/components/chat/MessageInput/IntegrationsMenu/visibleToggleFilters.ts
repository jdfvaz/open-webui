import { mergeVisibleIntegrationIds } from '../integrationSelection';
import type { ToggleFilter } from './types';

export const resolveVisibleToggleFilters = (
	filters: readonly ToggleFilter[],
	selectedFilterIds: readonly string[],
	preserveUnavailableSelections: boolean
): ToggleFilter[] => {
	if (!preserveUnavailableSelections) return [...filters];

	return mergeVisibleIntegrationIds(
		filters.map((filter) => filter.id),
		selectedFilterIds
	).map(
		(filterId) =>
			filters.find((filter) => filter.id === filterId) ?? { id: filterId, name: filterId }
	);
};
