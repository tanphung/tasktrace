# TaskTrace v1.1 verification report

Verified on 8 September 2026. This report describes a StudioNet release candidate, not a security audit, Bradbury deployment, recipient-payment proof, hackathon submission, or acceptance by GenLayer.

## Build identity

- Network: StudioNet, chain ID `61999`
- Contract: `0x8128cD94346c94fe1FF20204d54a4B980Ae00b61`
- Contract version: `tasktrace-1.1`
- Source SHA-256: `a5bc7d153af669d5a03dc4e68e89ed88159ad0d265f17c2064a1f07733235391`
- Raw integration evidence: `reports/studionet-sep07probe/`
- React/provider evidence: `reports/frontend-live/`

## Offline and build gates

| Gate | Result |
| --- | --- |
| GenVM lint | PASS, 3 checks |
| Direct and adversarial contract tests | PASS, 92 tests |
| Receipt-decoder tests | PASS, 2 tests |
| Frontend unit/component tests | PASS, 64 tests |
| Live React/provider happy path | PASS, 1 test |
| TypeScript test compile | PASS |
| Production build | PASS; 759.57 kB bundle warning remains |
| npm production dependency audit | 0 known vulnerabilities; not a security audit |

The direct tests use controlled LLM mocks. Live accuracy claims below come only from finalized StudioNet transactions.

## Live consensus matrix

All 16 cases matched the expected outcomes. The manifest contains 113 tracked steps: one deployment plus seven finalized lifecycle transactions per case. Every tracked step is `FINALIZED_SUCCESS`; schema and deployed-config checks are true.

| Case | Runs | Expected and actual result |
| --- | ---: | --- |
| A introduces the error | 4 | A violated, B satisfied |
| B introduces the error | 3 | A satisfied, B violated |
| Neither introduces an error | 3 | A satisfied, B satisfied |
| Timing answer omits approval prerequisite | 1 | A violated, B violated |
| A and B make independent errors | 1 | A violated, B violated |
| Source lacks requested information; both state uncertainty | 1 | A satisfied, B satisfied |
| B accepted an optional source-verification duty | 1 | A violated, B violated |
| Prompt injection appears in the final source chunk | 1 | A satisfied, B violated |
| Reference source conflicts with itself | 1 | A satisfied, B satisfied |

The fourth A-error run is the first v1.1 probe; the three `core` runs are the consecutive stability set. The conflicting-source case required additional validator rounds before finalizing, but it converged to the expected result.

## React/provider live path

Job `work-69d379f8` was driven through the actual React form components and the application's provider request path with three isolated StudioNet accounts. The seven persisted records—create, accept A, accept B, submit A, submit B, request review, and resolve—are all `FINALIZED_SUCCESS`. Final on-chain state is `RESOLVED`; A and B are both `SATISFIED`.

This test proves the application wiring can produce and observe real StudioNet writes. It does not certify a user's MetaMask extension or GenLayer Wallet Snap installation.

## Safety properties exercised

- Transaction intent and hash are persisted before polling; uncertain writes are not automatically resubmitted.
- Final UI success requires a receipt bound to the expected sender, contract, calldata, hash, successful execution, and expected post-state.
- Full UTF-8 artifacts are size-bounded, chunked deterministically, hashed, and reviewed as a complete snapshot.
- Findings require exact source and deliverable citations; untrusted document text cannot change reviewer instructions.
- Immutable terms, accepted obligations, settlement arithmetic, claim recipient, and emitted-message accounting are revalidated by the frontend.
- AI output cannot choose fees, bonds, penalties, recipients, deadlines, or transfer amounts.

## Remaining release gates

1. User reviews this evidence and explicitly authorizes Bradbury deployment.
2. Deploy the identical reviewed source to Bradbury with a limited test account.
3. Run a Bradbury smoke workflow and verify an external EOA child transfer before calling any claim a completed payment.
4. Point the frontend at the verified Bradbury deployment, rerun tests/build, and publish the reserved Sites project.
5. Verify the public URL and prepare the final portal fields. The user will connect their own portal wallet and submit.

StudioNet has no EVM layer. `MESSAGE_EMITTED` therefore remains a message state, never recipient-payment proof.
