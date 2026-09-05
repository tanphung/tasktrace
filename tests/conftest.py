import copy
import json
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

import pytest


SOURCE = "Export requires approval. Trial accounts cannot export. Paid accounts may export after approval."
GOOD = "Trial accounts cannot export. Paid accounts may export only after approval."
BAD = "Trial accounts can export immediately. Paid accounts can export immediately."
TASK = "Explain whether trial and paid accounts can export, and whether approval is needed."


@pytest.fixture(autouse=True)
def windows_direct_stdin_compat(monkeypatch):
    """Upstream unlinks its temporary stdin while it is open (valid POSIX, invalid Windows).

    Defer only that WinError 32 cleanup until after VM teardown. No contract behavior
    or validator result is mocked by this platform adapter.
    """
    if os.name != "nt":
        yield
        return
    import gltest.direct.loader as loader
    original = loader._inject_message_to_fd0
    pending = []
    def inject(vm):
        try:
            original(vm)
        except PermissionError as error:
            if error.winerror != 32 or not error.filename or vm._original_stdin_fd is None:
                raise
            pending.append(Path(error.filename))
    monkeypatch.setattr(loader, "_inject_message_to_fd0", inject)
    yield
    for path in pending:
        path.unlink(missing_ok=True)


@pytest.fixture
def system(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, direct_owner):
    direct_vm.warp("2026-09-05T12:00:00Z")
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/tasktrace.py", sdk_version="v0.2.12")
    module = sys.modules["_contract_tasktrace"]

    class System:
        vm = direct_vm
        c = contract
        m = module
        client, a, b, outsider = [module.Address(x if isinstance(x, bytes) else x.as_bytes)
                                  for x in (direct_alice, direct_bob, direct_charlie, direct_owner)]

        def sender(self, address, value=0):
            self.vm.sender = address
            self.vm.value = value

        def now(self, timestamp):
            # gltest 0.29.2 warp refreshes MessageType but not message_raw datetime.
            # Supply the same chain timestamp explicitly for this documented harness gap.
            iso = datetime.fromtimestamp(timestamp, timezone.utc).isoformat()
            self.vm.warp(iso)
            self.m.gl.message_raw["datetime"] = iso

        def job(self, job_id="demo-job"):
            return json.loads(self.c.get_job(job_id))

        def create(self, job_id="demo-job", **changes):
            values = dict(job_id=job_id, title="Export policy report", task=TASK, source=SOURCE,
                          worker_a=self.a, worker_b=self.b, fee_a=10, fee_b=20, bond_a=5, bond_b=7,
                          penalty_a=3, penalty_b=4, accept_seconds=60, step_seconds=60,
                          review_seconds=60, adjudication_seconds=60, verify_source=False)
            values.update(changes)
            self.sender(self.client, values["fee_a"] + values["fee_b"])
            self.c.create_job(**values)
            self.vm.value = 0
            return self.job(job_id)

        def accept(self, role, job_id="demo-job"):
            job = self.job(job_id)
            self.sender(self.a if role == "A" else self.b, int(job["terms"]["money"][role]["bond"]))
            assert str(self.m.gl.message.sender_address) == job["workers"][role], (str(self.m.gl.message.sender_address), job["workers"][role])
            self.c.accept_job(job_id, job["terms_hash"])
            self.vm.value = 0

        def active(self, **changes):
            self.create(**changes)
            self.accept("A")
            self.accept("B")

        def submit(self, role, text=GOOD, job_id="demo-job"):
            self.sender(self.a if role == "A" else self.b)
            previous = "SOURCE" if role == "A" else "A"
            upstream = self.job(job_id)["artifacts"][previous]["submission_id"]
            self.c.submit_work(job_id, text, upstream)

        def ready(self, a_text=GOOD, b_text=GOOD, **changes):
            self.active(**changes)
            self.submit("A", a_text)
            self.submit("B", b_text)

        def snapshot(self):
            return json.loads(self.c.get_review_input("demo-job"))["snapshot"]

        def response(self, a="SATISFIED", b="SATISFIED"):
            snapshot = self.snapshot()
            chunks = self.m._verify_snapshot(snapshot)
            result = {"reviewed_chunks": [c["id"] for c in chunks], "assessments": []}
            for obligation in snapshot["obligations"]:
                cites = []
                for role in obligation["evidence_roles"]:
                    chunk = next(c for c in chunks if c["role"] == role)
                    # Fixtures are short ASCII here. Quote a complete supporting sentence.
                    quote = chunk["content"].split(".")[0] + "."
                    cites.append({"chunk_id": chunk["id"], "quote": quote})
                result["assessments"].append({"obligation_id": obligation["id"], "status": a if obligation["stage"] == "A" else b,
                                               "reason": "Controlled unit-test response; not an actual AI verdict.", "citations": cites})
            return result

        def resolve(self, a="SATISFIED", b="SATISFIED"):
            self.sender(self.client)
            self.c.request_review("demo-job")
            self.vm.mock_llm("TASKTRACE_REVIEW_V1", json.dumps(self.response(a, b)))
            self.c.resolve_review("demo-job")
            return self.job()

    return System()
