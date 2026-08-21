from open_webui.models import automations as automation_models


def test_automation_data_preserves_explicit_empty_integration_selection() -> None:
    # Given an automation that explicitly disables every selectable integration axis
    data = automation_models.AutomationData(
        prompt='Summarize repository activity',
        model_id='model-id',
        rrule='RRULE:FREQ=DAILY',
        tool_ids=[],
        skill_ids=[],
        filter_ids=[],
        feature_ids=[],
    )

    # When the API model is serialized for persistence
    persisted = data.model_dump()

    # Then every empty selection remains distinct from inherited defaults
    assert persisted['tool_ids'] == []
    assert persisted['skill_ids'] == []
    assert persisted['filter_ids'] == []
    assert persisted['feature_ids'] == []


def test_automation_data_uses_null_for_inherited_integrations() -> None:
    # Given an automation without explicit integration selections
    data = automation_models.AutomationData(
        prompt='Summarize repository activity',
        model_id='model-id',
        rrule='RRULE:FREQ=DAILY',
    )

    # When the API model is serialized for persistence
    persisted = data.model_dump()

    # Then every integration axis remains inherited
    assert persisted['tool_ids'] is None
    assert persisted['skill_ids'] is None
    assert persisted['filter_ids'] is None
    assert persisted['feature_ids'] is None
