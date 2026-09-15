# VeriStep

Accountability for two-stage work handoffs, with evidence-based adjudication on GenLayer.

**Verified Bradbury testnet release candidate — not audited, not submitted, and not guaranteed acceptance by GenLayer.**

Intended Agent Tank hackathon track: **Future of Work**. The project is not an approved or submitted hackathon entry yet.

Public demo: **https://veristep-genlayer.vercel.app/#job=bradbury-happy-a5bc7d15**

The production URL was verified on 9 September 2026 without signing in. It loaded the finalized Bradbury job, all four `SATISFIED` findings, and the exact `+0.03 GEN` recipient-payment evidence.

## V2 release candidate (StudioNet verified, not released)

The next contract is implemented in `contracts/veristep.py`; the production
site intentionally remains on the separately verified v1.1 deployment until the
v2 release gate and fresh deployment approval are complete. V2 moves the entire
settlement-affecting path into the Intelligent Contract: exact funded obligation
IDs, independently refetched GitHub artifacts, whole-artifact SHA-256 and semantic
review, structured reports, deterministic timeouts/entitlements, and exact router
receipt confirmation. `contracts/VeriStepReceiptRouter.sol` only executes and
records the IC-selected transfer; it cannot choose a verdict or recipient.

Current gates: GenVM lint passes; 252 Python direct/adversarial regression tests
pass (157 in the v2 contract suite); 80 React tests plus two receipt tests,
15 hosted-worker tests, TypeScript, Cloudflare Worker dry-run, the production
bundle and dependency audit pass; and 20 EVM router cases pass. The current
source is also deployed to gasless StudioNet for semantic-only verification at
`0x21f3D8DBB47DFb7dd031a7bC453614513c86DFfF`. Both full lifecycle
committee cases passed: a faithful pair was assessed A/B `SATISFIED`, while a
late contradictory sentence was detected across the complete artifact and
assessed A `VIOLATED`, B `SATISFIED`. Five additional finalized GenVM writes
rejected a confused hostname, wrong owner, mutable version, malformed SHA-256
and incomplete obligation set without persisting a deal. These results are not a
Bradbury deployment or native router-settlement claim; public v2 selection still
requires the separate release approval and Bradbury receipt round trip.

The optional A/B runtime under `worker/` targets Cloudflare Workers, Workflows
and D1 Free. It has durable transaction checkpoints, distinct role keys,
immutable GitHub publication, B-after-finalized-A enforcement, wallet-bound
authorization and an integer hard cap of 0.80 USD for build/test OpenAI usage.
It can only accept and submit worker artifacts; it cannot request adjudication,
select a verdict or settle funds. Remote worker deployment remains release-locked.
The live OpenAI A/B smoke passed with structured outputs on `gpt-5.6-luna`:
both stages preserved the complete final provenance exception, costing
0.0001722 USD in total. The earlier failed authentication ID remains separately
reserved under the conservative no-automatic-retry policy.

## The idea

A client assigns an extraction task to worker/agent A, then a reporting task to worker/agent B. When a report is wrong, VeriStep asks where the error entered the chain. B is not automatically penalized for faithfully passing on an upstream A error. A separate, optional duty makes B responsible for checking the original source too.

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
- 65 passing frontend tests and two receipt-decoder tests (`npm test`), plus a separate full React-form/provider test against finalized StudioNet state.
- A real StudioNet v1.1 deployment with verified schema/config and **16/16 live adjudication cases passing**. The core A-fault, B-fault, and no-fault cases each passed three consecutive repetitions. Adversarial cases cover timing omission, both workers at fault, honest uncertainty, optional source-verification duty, tail-chunk prompt injection, and a conflicting reference source.
- 113/113 tracked integration steps are `FINALIZED_SUCCESS`: one deployment plus seven lifecycle transactions for each of 16 cases. Raw receipts and resulting jobs are preserved.
- The identical v1.1 source is deployed on Bradbury. A real three-wallet happy path reached `RESOLVED`; A and B were independently judged `SATISFIED`. Every successful lifecycle transaction reached finality. The first adjudication attempt ended `UNDETERMINED` and is preserved; one bounded retry finalized successfully.
- Worker A's claim finalized with one `0.03 GEN` message to the expected EOA. The Bradbury finalization transaction succeeded and the recipient balance increased by exactly `0.03 GEN` in that block. This is recipient-payment evidence, not a production or security guarantee.
- A React workspace with wallet actions, job creation, complete evidence/citations, role restrictions, deadlines, deterministic ledger checks, immutable-term verification, and persisted transaction tracking. The installed GenLayerJS version connects browser wallets through MetaMask's GenLayer Wallet Snap; the UI names this requirement.
- A full happy-path test used the actual React forms and application provider requests to create, accept, submit, request review, and resolve a StudioNet job with three isolated test accounts. All seven transaction records are `FINALIZED_SUCCESS`; the resulting job is `RESOLVED` with both roles `SATISFIED`. This validates application wiring and real network writes, but it is not certification of a user's MetaMask/Snap installation.
- TypeScript/Vite production build passes; bundle-size warning remains. The checkpoint dependency audit reports zero known npm vulnerabilities (not a security audit).
- Design/security documents, nine prepared fixtures, resumable no-auto-resend StudioNet and Bradbury runners, and preserved historical failures that motivated the v1.1 coverage policy.

The portal submission is intentionally left to the user, who will connect their own wallet and accept the hackathon terms. The project is a public-testnet demonstration, not an audit or a promise of team acceptance.

## Bradbury evidence

- RPC chain: `4221`; GenVM evidence-domain chain ID returned by the deployed contract: `1`.
- Contract: `0x3FC5dce3abadf149111A45ae9936eBdD7A67AA88`.
- Deployment transaction: `0xb98884870579ce28d933677f1fe1889f227c86c7b3c302c3c51aef9a1d7e44d2`.
- Source SHA-256: `a5bc7d153af669d5a03dc4e68e89ed88159ad0d265f17c2064a1f07733235391`.
- Smoke job: `bradbury-happy-a5bc7d15`; final state `RESOLVED`, A/B `SATISFIED`.
- Claim: parent `0x5887f65277dc770bac30c60d3a319bba52a31e3239efe4674ba547caa8936218`; finalization transaction `0xa6770b72cd00d6fa1bd0393ecd0e50df39d513b1a7825e573070524112e5c9ff`; recipient delta `+0.03 GEN` at block `21205036`.

See [Bradbury receipts and manifest](reports/bradbury-release/) and the [verification report](docs/VERIFICATION-REPORT.md).

## StudioNet evidence

- Chain: `61999` (StudioNet only).
- Contract: `0x8128cD94346c94fe1FF20204d54a4B980Ae00b61`.
- Deployed source SHA-256: `a5bc7d153af669d5a03dc4e68e89ed88159ad0d265f17c2064a1f07733235391`.
- Contract version: `veristep-1.1`.
- Live matrix: 16/16 cases passed; 113/113 integration steps finalized successfully; schema and config checks passed.
- React/provider E2E job: `work-69d379f8`; seven lifecycle transactions finalized successfully; result `RESOLVED`, A/B both `SATISFIED`.

See [v1.1 receipts](reports/studionet-sep07probe/), [React/provider E2E evidence](reports/frontend-live/), [historical failures](reports/archive/), [direct test report](reports/direct-tests.xml), and [resume notes](docs/RESUME.md). StudioNet cannot establish an EVM recipient payout; that requires separate Bradbury verification.

### V2 semantic release gate

- Contract: `0x41BcdFB280BD26939cb6956B55ddA7e85b4567c9`; deployment transaction `0xea5700856225a70267eb8d4dce92e0b9c1ddb2223d35685a4e971b449a4f2cef`.
- Exact contract source SHA-256: `3133e10bf159d16a9fa49a1ec93f70cd02d1396e6f37983ed75534c5b2c3768e`; immutable evidence commit `f4b48b235d15c0be61cbd75bf491dde1b98ad058`.
- 17/17 positive lifecycle writes finalized with successful execution across two committee-reviewed cases.
- 5/5 adversarial writes finalized with the expected execution failure and no persisted deal.
- StudioNet router was intentionally set to `0x000000000000000000000000000000000000dEaD`; the run proves semantic consensus and deterministic rejection, not transfer completion.

See [the sanitized V2 StudioNet manifest](reports/v2-studionet-semantic/manifest.json) and [V2 release-candidate checkpoint](docs/V2-CORE-PROGRESS.md).

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
.venv/Scripts/genvm-lint.exe check contracts/veristep.py --json
.venv/Scripts/genvm-lint.exe check contracts/veristep.py --json
.venv/Scripts/python.exe -m pytest tests/direct tests/adversarial -q
npm run test:router
```

The direct test harness has a narrow Windows compatibility workaround for an upstream temporary-file unlink issue. It also explicitly updates the deterministic message timestamp in tests. Neither workaround substitutes for live integration validation.

### Live StudioNet runner — explicit opt-in

```powershell
npm run test:integration
npm run test:v2:studionet
```

These commands submit live StudioNet transactions, not local unit tests. They use dedicated keys in ignored `.secrets/`, **not** the funded root `.env`. Each runner persists transaction hashes before polling and will not silently resubmit uncertain writes. The V2 runner deliberately disables the settlement router because StudioNet does not certify the native EVM payout path.

The committed report is a historical run, not reusable signing material. Resuming it requires the original local StudioNet keys and unchanged source. On a fresh clone the runner will refuse mismatching wallets. Read the [resume instructions](docs/RESUME.md) before starting a new run; never delete failure evidence to make results look clean.

The React/provider live test is also explicit opt-in. It consumes StudioNet test GEN only when its persisted happy-path job is absent:

```powershell
$env:VERISTEP_LIVE_WALLET_TEST = 'studionet-only'
npm run test:live-wallet
```

It signs with ignored, isolated StudioNet fixtures and exercises the real UI components and provider request path. It does not import the funded root `.env` and does not claim to automate or certify a user's MetaMask extension.

### Bradbury release evidence — explicit opt-in

The committed Bradbury report is resumable and will not resend a step whose hash is already recorded. A fresh deployment intentionally requires the exact confirmation value and the reviewed source hash:

```powershell
$env:VERISTEP_BRADBURY_CONFIRM = 'deploy-and-smoke-v1.1'
npm run release:bradbury
```

This command reads the locally ignored `.env`, deploys/funds/submits public-testnet transactions, and can spend test GEN. Do not run it merely to inspect the committed report. It distinguishes provisional acceptance from finality and records terminal validator failures instead of hiding them.

## Security and publication

`.env`, `.secrets/`, caches, virtual environments, and build dependencies are ignored by Git. Only an empty `.env.example` is included. Before each commit, stage the intended files and run:

```powershell
npm run check:secrets
```

The guard scans staged blobs for known local secrets, sensitive paths, and common credential patterns without printing secret values. It is a best-effort check, not an audit or a guarantee. After committing, `node scripts/check-secrets.mjs --head` checks the committed tree.

The Bradbury deployment was performed only after the required gates and the user's explicit authorization. Future deployments remain subject to the same `AGENTS.md` gate.

## Design and next work

- [Detailed project plan (Vietnamese)](docs/KE-HOACH-VERISTEP.md)
- [Threat model](docs/THREAT-MODEL.md)
- [Evidence schema](docs/EVIDENCE-SCHEMA.md)
- [Full-artifact review](docs/FULL-ARTIFACT-REVIEW.md)
- [Adversarial plan](docs/ADVERSARIAL-TEST-PLAN.md)
- [Verification report](docs/VERIFICATION-REPORT.md)
- [Implementation decisions](docs/IMPLEMENTATION-DECISIONS.md)
- [Next-session handoff](docs/RESUME.md)
