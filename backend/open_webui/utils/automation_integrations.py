from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI


AUTOMATION_FEATURE_IDS = ('web_search', 'image_generation')


@dataclass(frozen=True, slots=True)
class AutomationIntegrationSelection:
    tool_ids: list[str] | None = None
    skill_ids: list[str] | None = None
    filter_ids: list[str] | None = None
    feature_ids: list[str] | None = None


@dataclass(frozen=True, slots=True)
class ResolvedAutomationIntegrations:
    tool_ids: list[str]
    skill_ids: list[str]
    filter_ids: list[str]
    features: dict[str, bool]
    terminal_id: str | None


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str)]


def has_only_accessible_ids(selected_ids: list[str] | None, accessible_ids: set[str]) -> bool:
    return selected_ids is None or all(item_id in accessible_ids for item_id in selected_ids)


def resolve_automation_integration_defaults(
    model_meta: Mapping[str, object],
    selection: AutomationIntegrationSelection,
    feature_availability: Mapping[str, bool],
) -> ResolvedAutomationIntegrations:
    tool_ids = list(selection.tool_ids) if selection.tool_ids is not None else _string_list(model_meta.get('toolIds'))
    skill_ids = (
        list(selection.skill_ids) if selection.skill_ids is not None else _string_list(model_meta.get('skillIds'))
    )
    filter_ids = (
        list(selection.filter_ids)
        if selection.filter_ids is not None
        else _string_list(model_meta.get('defaultFilterIds'))
    )
    feature_ids = (
        list(selection.feature_ids)
        if selection.feature_ids is not None
        else _string_list(model_meta.get('defaultFeatureIds'))
    )

    capabilities_value = model_meta.get('capabilities')
    capabilities = capabilities_value if isinstance(capabilities_value, Mapping) else {}
    features = {
        feature_id: True
        for feature_id in feature_ids
        if feature_id in AUTOMATION_FEATURE_IDS
        and capabilities.get(feature_id) is True
        and feature_availability.get(feature_id) is True
    }
    terminal_value = model_meta.get('terminalId')

    return ResolvedAutomationIntegrations(
        tool_ids=tool_ids,
        skill_ids=skill_ids,
        filter_ids=filter_ids,
        features=features,
        terminal_id=terminal_value if isinstance(terminal_value, str) and terminal_value else None,
    )


async def resolve_automation_integrations(
    app: FastAPI,
    model_id: str,
    selection: AutomationIntegrationSelection,
) -> ResolvedAutomationIntegrations:
    from open_webui.models.config import Config

    models_value = getattr(app.state, 'MODELS', {})
    models = models_value if isinstance(models_value, Mapping) else {}
    model_value = models.get(model_id)
    model = model_value if isinstance(model_value, Mapping) else {}
    info_value = model.get('info')
    info = info_value if isinstance(info_value, Mapping) else {}
    meta_value = info.get('meta')
    model_meta = meta_value if isinstance(meta_value, Mapping) else {}

    return resolve_automation_integration_defaults(
        model_meta,
        selection,
        {
            'web_search': bool(await Config.get('web.search.enable')),
            'image_generation': bool(await Config.get('image_generation.enable')),
        },
    )
