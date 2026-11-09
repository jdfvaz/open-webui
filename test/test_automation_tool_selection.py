import pytest
from open_webui.models import automations as automation_models


@pytest.mark.parametrize('model_id', ['regular-model', 'agent:review'])
def test_agent_automation_discards_chat_integrations(model_id: str) -> None:
    selection = {
        'tool_ids': ['github'],
        'skill_ids': ['release-notes'],
        'filter_ids': ['review-filter'],
        'feature_ids': ['web_search'],
    }

    data = automation_models.AutomationData.model_validate(
        {
            'prompt': 'Summarize repository activity',
            'model_id': model_id,
            'rrule': 'RRULE:FREQ=DAILY',
            **selection,
        }
    ).model_dump()

    assert {key: data[key] for key in selection} == (
        dict.fromkeys(selection) if model_id.startswith('agent:') else selection
    )


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
