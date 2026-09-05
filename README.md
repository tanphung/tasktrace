# TaskTrace

Accountability for two-stage work handoffs, with evidence-based adjudication on GenLayer.

**Development checkpoint — not submission-ready, not audited, and not deployed to Bradbury.**

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

## What exists at this checkpoint

- A pinned-runner Python Intelligent Contract with authorization, immutable handoffs, bounded full-text evidence, custom validator checks, deterministic credits, deadlines, and claims.
- 56 passing direct/adversarial tests, using controlled LLM mocks; these do not prove live AI accuracy.
- Two passing receipt-decoder unit tests (`npm test`); these are not live network integration tests.
- A real StudioNet deployment with schema/config checks and successful transaction receipts up to the first review request.
- An initial read-only React workspace. Wallet actions, job creation, complete review rendering, agent execution, and browser E2E tests are unfinished.
- TypeScript/Vite production build passes; bundle-size warning remains. The checkpoint dependency audit reports zero known npm vulnerabilities (not a security audit).
- Design/security documents, eight prepared test fixtures, a resumable StudioNet runner, and preserved raw receipts including the failed run.

**Known blocker:** the first live AI review ended `UNDETERMINED`. Its final leader receipt reports `[LLM_ERROR] Missing source/deliverable citation`. No live adjudication case has passed end-to-end yet. The strict citation checks must remain in place while response reliability is improved.

No Bradbury transaction or verified recipient payout has been performed. No public website has been deployed. A static hosting project is reserved; it is not a live demo.

## StudioNet evidence

- Chain: `61999` (StudioNet only).
- Contract: `0xebF38AD46a3C3D4728D84E0BF3EBD842Edab4802`.
- Deployment transaction: `0x8cf6c780629d4c08ee90fd279e477bdfa0010cb519d78ccfd83aa290353c371b`.
- Failed review transaction: `0x5884c07f6a95eb891e9f3857c420f5632ec2bcaf3548fbc3984fa51f512db0ec`.
- Deployed source SHA-256: `4606d0387360f0b4c0613a8188221def59225cdc0155e2b502af1b0dc2633f5c`.

See [preserved receipts](reports/studionet/), [direct test report](reports/direct-tests.xml), and [resume notes](docs/RESUME.md). StudioNet cannot establish an EVM recipient payout; that requires separate testnet verification.

## Local setup

Requirements: a current Node.js compatible with Vite 7, npm, Python 3.12, and `uv`. The checkpoint was built on Windows. Do not put a funded private key in a frontend variable.

```powershell
npm ci
npm test
npm run build
npm run dev
```

`npm test` currently runs only the receipt-decoder unit tests. No frontend component or browser test suite is complete. The development server binds to `127.0.0.1`.

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
- [Implementation decisions](docs/IMPLEMENTATION-DECISIONS.md)
- [Next-session handoff](docs/RESUME.md)
