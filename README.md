# TaskTrace

Accountability for two-stage work handoffs, with evidence-based adjudication on GenLayer.

**Verified StudioNet release candidate — not audited, not deployed to Bradbury, and not submitted.**

Intended Agent Tank hackathon track: **Future of Work**. The project is not an approved or submitted hackathon entry yet.

## The idea

A client assigns an extraction task to worker/agent A, then a reporting task to worker/agent B. When a report is wrong, TaskTrace asks where the error entered the chain. B is not automatically penalized for faithfully passing on an upstream A error. A separate, optional duty makes B responsible for checking the original source too.

The source document is the agreed reference, not proof of real-world truth. All three parties accept immutable terms. Complete small text artifacts and their hashes are stored on-chain; adjudication cites exact chunks and quotations. GenLayer validators independently assess the obligations. Fees, bonds, deadlines, recipients, and penalties are deterministic, not chosen by the LLM.

For each stage, fee `F`, bond `B`, and maximum penalty `P <= B` are agreed upfront:

| Outcome | Client credit | Worker credit |
| --- | --- | --- |
| Satisfied | 0 | F + B |
| Violated | F + P | B - P |
| Unassessable, after deadline | F | B |

Credits and emitted payment messages are **not** proof of a completed recipient payment.

## Verified release-candidate status

- A pinned-runner Python Intelligent Contract with authorization, immutable handoffs, bounded full-text evidence, custom validator checks, deterministic credits, deadlines, and claims.
- 92 passing direct/adversarial tests using controlled LLM mocks; these test contract logic but do not substitute for live consensus.
- 64 passing frontend tests and two receipt-decoder tests (`npm test`), plus a separate full React-form/provider test against finalized StudioNet state.
- A real StudioNet v1.1 deployment with verified schema/config and **16/16 live adjudication cases passing**. The core A-fault, B-fault, and no-fault cases each passed three consecutive repetitions. Adversarial cases cover timing omission, both workers at fault, honest uncertainty, optional source-verification duty, tail-chunk prompt injection, and a conflicting reference source.
- 113/113 tracked integration steps are `FINALIZED_SUCCESS`: one deployment plus seven lifecycle transactions for each of 16 cases. Raw receipts and resulting jobs are preserved.
- A React workspace with wallet actions, job creation, complete evidence/citations, role restrictions, deadlines, deterministic ledger checks, immutable-term verification, and persisted transaction tracking. The installed GenLayerJS version connects browser wallets through MetaMask's GenLayer Wallet Snap; the UI names this requirement.
- A full happy-path test used the actual React forms and application provider requests to create, accept, submit, request review, and resolve a StudioNet job with three isolated test accounts. All seven transaction records are `FINALIZED_SUCCESS`; the resulting job is `RESOLVED` with both roles `SATISFIED`. This validates application wiring and real network writes, but it is not certification of a user's MetaMask/Snap installation.
- TypeScript/Vite production build passes; bundle-size warning remains. The checkpoint dependency audit reports zero known npm vulnerabilities (not a security audit).
- Design/security documents, nine prepared fixtures, a resumable no-auto-resend StudioNet runner, and preserved historical failures that motivated the v1.1 coverage policy.

No Bradbury transaction or verified external-recipient payout has been performed. StudioNet has no EVM layer, so an emitted claim message is deliberately not displayed as recipient payment proof. No public website has been deployed. A static hosting project is reserved; it is not a live demo.

## StudioNet evidence

- Chain: `61999` (StudioNet only).
- Contract: `0x8128cD94346c94fe1FF20204d54a4B980Ae00b61`.
- Deployed source SHA-256: `a5bc7d153af669d5a03dc4e68e89ed88159ad0d265f17c2064a1f07733235391`.
- Contract version: `tasktrace-1.1`.
- Live matrix: 16/16 cases passed; 113/113 integration steps finalized successfully; schema and config checks passed.
- React/provider E2E job: `work-69d379f8`; seven lifecycle transactions finalized successfully; result `RESOLVED`, A/B both `SATISFIED`.

See [v1.1 receipts](reports/studionet-sep07probe/), [React/provider E2E evidence](reports/frontend-live/), [historical failures](reports/archive/), [direct test report](reports/direct-tests.xml), and [resume notes](docs/RESUME.md). StudioNet cannot establish an EVM recipient payout; that requires separate Bradbury verification.

## Local setup

Requirements: a current Node.js compatible with Vite 7, npm, Python 3.12, and `uv`. The checkpoint was built on Windows. Do not put a funded private key in a frontend variable.

```powershell
npm ci
npm test
npm run test:types
npm run build
npm run dev
```

`npm test` runs receipt-decoder and frontend unit/component tests. The development server binds to `127.0.0.1`.

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
$env:GENVM_VERSION = 'v0.2.12'
.venv/Scripts/genvm-lint.exe check contracts/tasktrace.py --json
.venv/Scripts/python.exe -m pytest tests/direct tests/adversarial -q
```

The direct test harness has a narrow Windows compatibility workaround for an upstream temporary-file unlink issue. It also explicitly updates the deterministic message timestamp in tests. Neither workaround substitutes for live integration validation.

### Live StudioNet runner — explicit opt-in

```powershell
npm run test:integration
```

This command submits live StudioNet transactions, not local unit tests. It uses dedicated keys in ignored `.secrets/studionet.json`, **not** the funded root `.env`. It persists transaction hashes before polling and will not silently resubmit uncertain writes.

The committed report is a historical run, not reusable signing material. Resuming it requires the original local StudioNet keys and unchanged source. On a fresh clone the runner will refuse mismatching wallets. Read the [resume instructions](docs/RESUME.md) before starting a new run; never delete failure evidence to make results look clean.

The React/provider live test is also explicit opt-in. It consumes StudioNet test GEN only when its persisted happy-path job is absent:

```powershell
$env:TASKTRACE_LIVE_WALLET_TEST = 'studionet-only'
npm run test:live-wallet
```

It signs with ignored, isolated StudioNet fixtures and exercises the real UI components and provider request path. It does not import the funded root `.env` and does not claim to automate or certify a user's MetaMask extension.

## Security and publication

`.env`, `.secrets/`, caches, virtual environments, and build dependencies are ignored by Git. Only an empty `.env.example` is included. Before each commit, stage the intended files and run:

```powershell
npm run check:secrets
```

The guard scans staged blobs for known local secrets, sensitive paths, and common credential patterns without printing secret values. It is a best-effort check, not an audit or a guarantee. After committing, `node scripts/check-secrets.mjs --head` checks the committed tree.

Bradbury deployment remains gated by `AGENTS.md`: lint, direct/adversarial tests, complete live integration, and frontend tests/build must pass, then the user must review results and explicitly confirm deployment.

## Design and next work

- [Detailed project plan (Vietnamese)](docs/KE-HOACH-TASKTRACE.md)
- [Threat model](docs/THREAT-MODEL.md)
- [Evidence schema](docs/EVIDENCE-SCHEMA.md)
- [Full-artifact review](docs/FULL-ARTIFACT-REVIEW.md)
- [Adversarial plan](docs/ADVERSARIAL-TEST-PLAN.md)
- [Verification report](docs/VERIFICATION-REPORT.md)
- [Implementation decisions](docs/IMPLEMENTATION-DECISIONS.md)
- [Next-session handoff](docs/RESUME.md)
