"""Release gates, NOT network/EVM integration and NOT expected-failure tests.

Exercise the official cached SDK through its public typed interface. Only the
host-call boundary is captured; the SDK proxy and ABI encoder are unmodified.
These tests must pass before selecting the proposed v2 settlement router.
"""

import importlib
import inspect

import pytest


@pytest.fixture
def pinned_sdk(system):
    # Existing fixture loads the exact v0.2.12 runner/header without chain writes.
    return system.m


def interface(m):
    @m.gl.evm.contract_interface
    class ReceiptRouter:
        class View:
            def released(self, receipt_id: m.u256, /) -> m.u256: ...

        class Write:
            def fund(self, receipt_id: m.u256, /) -> None: ...

    return ReceiptRouter(m.Address("0x" + "11" * 20))


def capture_host(monkeypatch):
    calls = []

    class Captured:
        def get(self):
            return None

    def capture(payload, decoder):
        calls.append(payload)
        return Captured()

    module = importlib.import_module("genlayer.gl._internal.gl_call")
    monkeypatch.setattr(module, "gl_call_generic", capture)
    return calls


def test_typed_evm_view_reaches_host_with_exact_router(pinned_sdk, monkeypatch):
    m = pinned_sdk
    calls = capture_host(monkeypatch)
    interface(m).view().released(m.u256(7))
    assert len(calls) == 1
    assert str(calls[0]["EthCall"]["address"]) == "0x" + "11" * 20
    assert int.from_bytes(calls[0]["EthCall"]["calldata"][-32:], "big") == 7


def test_typed_evm_emit_preserves_exact_native_value(pinned_sdk, monkeypatch):
    m = pinned_sdk
    calls = capture_host(monkeypatch)
    interface(m).emit(value=m.u256(123)).fund(m.u256(7))
    assert len(calls) == 1
    assert calls[0]["EthSend"]["value"] == 123
    assert int.from_bytes(calls[0]["EthSend"]["calldata"][-32:], "big") == 7


def test_web_request_exposes_redirect_control_or_history(pinned_sdk):
    """Capability gate, not a live redirect test.

    The inspected release's HTTP client uses the default redirect policy. A
    later version must expose documented control/history, or replace this gate
    with a real-runtime proof of an unconditional no-follow policy. Do not make
    it green merely by adding an attribute to a mock.
    """
    web = pinned_sdk.gl.nondet.web
    parameters = inspect.signature(web.request).parameters
    response_fields = web.Response.__dataclass_fields__
    has_control = any(name in parameters for name in (
        "allow_redirects", "follow_redirects", "redirect_policy", "max_redirects"
    ))
    has_history = "history" in response_fields or "redirects" in response_fields
    assert has_control or has_history, (
        "Pinned web SDK exposes neither redirect control nor redirect history; "
        "external evidence adapter must remain disabled."
    )
