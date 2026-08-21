from open_webui.utils import automation_integrations


def test_mixed_automation_integration_overrides_resolve_independently() -> None:
    # Given model defaults and mixed inherited or explicit automation selections
    model_meta = {
        'toolIds': ['github'],
        'skillIds': ['release-notes'],
        'defaultFilterIds': ['deep-research'],
        'defaultFeatureIds': ['web_search', 'image_generation'],
        'capabilities': {'web_search': True, 'image_generation': True},
    }
    selection = automation_integrations.AutomationIntegrationSelection(
        tool_ids=None,
        skill_ids=[],
        filter_ids=['quick-research'],
        feature_ids=None,
    )

    # When the automation integrations are resolved
    resolved = automation_integrations.resolve_automation_integration_defaults(
        model_meta,
        selection,
        {'web_search': True, 'image_generation': False},
    )

    # Then every axis preserves its own inheritance or override contract
    assert resolved.tool_ids == ['github']
    assert resolved.skill_ids == []
    assert resolved.filter_ids == ['quick-research']
    assert resolved.features == {'web_search': True}


def test_explicit_empty_integrations_disable_every_model_default() -> None:
    # Given model defaults and explicit empty automation selections
    model_meta = {
        'toolIds': ['github'],
        'skillIds': ['release-notes'],
        'defaultFilterIds': ['deep-research'],
        'defaultFeatureIds': ['web_search'],
        'capabilities': {'web_search': True},
    }
    selection = automation_integrations.AutomationIntegrationSelection(
        tool_ids=[],
        skill_ids=[],
        filter_ids=[],
        feature_ids=[],
    )

    # When the automation integrations are resolved
    resolved = automation_integrations.resolve_automation_integration_defaults(
        model_meta,
        selection,
        {'web_search': True, 'image_generation': True},
    )

    # Then no model default remains enabled
    assert resolved.tool_ids == []
    assert resolved.skill_ids == []
    assert resolved.filter_ids == []
    assert resolved.features == {}


def test_explicit_integration_ids_must_be_accessible() -> None:
    # Given accessible IDs and inherited, empty, valid, or invalid selections
    accessible_ids = {'github', 'jira'}

    # When each selection is checked against the accessible set
    inherited = automation_integrations.has_only_accessible_ids(None, accessible_ids)
    empty = automation_integrations.has_only_accessible_ids([], accessible_ids)
    valid = automation_integrations.has_only_accessible_ids(['github'], accessible_ids)
    invalid = automation_integrations.has_only_accessible_ids(['removed-tool'], accessible_ids)

    # Then only the inaccessible explicit selection is rejected
    assert inherited is True
    assert empty is True
    assert valid is True
    assert invalid is False
