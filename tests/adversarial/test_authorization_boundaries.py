import pytest


@pytest.mark.parametrize("method", ["approve_work", "request_review", "resolve_review", "claim", "cancel_job"])
def test_outsider_cannot_change_participant_state(system, method):
    system.ready()
    before = system.job()
    system.sender(system.outsider)
    with system.vm.expect_revert("Only job participants"):
        getattr(system.c, method)("demo-job")
    assert system.job() == before


def test_wrong_funding_value_cannot_create_job(system, monkeypatch):
    sender = system.sender
    monkeypatch.setattr(system, "sender", lambda address, value=0: sender(address, value - 1 if value else 0))
    with system.vm.expect_revert("Send exact total fees"):
        system.create()


def test_expired_review_is_rejected_before_any_llm_call(system, monkeypatch):
    system.ready()
    system.sender(system.client)
    system.c.request_review("demo-job")
    system.now(system.job()["adjudication_deadline"])
    before = system.job()
    def forbidden(*args, **kwargs):
        pytest.fail("Expired review must not run an LLM")
    monkeypatch.setattr(system.m.gl.nondet, "exec_prompt", forbidden)
    with system.vm.expect_revert("Adjudication window closed"):
        system.c.resolve_review("demo-job")
    assert system.job() == before


def test_cancel_and_timeout_cannot_issue_credits_twice(system):
    system.create()
    system.accept("A")
    system.sender(system.client)
    system.c.cancel_job("demo-job")
    before = system.job()
    system.now(before["accept_deadline"] + 1)
    with system.vm.expect_revert():
        system.c.advance_timeout("demo-job")
    assert system.job() == before
