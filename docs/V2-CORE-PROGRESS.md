# V2 release-candidate checkpoint — 12 September 2026

Current source is `contracts/tasktrace_v2.py`, not the former draft-only
`tasktrace_v2_core.py`. The IC now exposes the complete funded lifecycle,
independently acquires all committed GitHub bytes in leader and validator runs,
stores the full structured report, applies deterministic deadline/settlement
rules and confirms only an exact released router receipt. The production v1.1
deployment remains unchanged and v2 is not deployed.

The minimal Solidity router is `contracts/TaskTraceReceiptRouter.sol`; adversarial
recipient contracts live only under `tests/evm/`. Latest component gates are:

- GenVM lint: 3 checks and ABI validation pass; 3 views and 9 writes.
- V2 direct suite: 157 passed; full Python regression: 252 passed.
- Router: 16 EVM cases pass, including wrong recipient, duplicate receipt,
  recipient revert and reentrancy.
- Frontend/receipt regression: 67 passed; TypeScript/Vite build passes.

Native local GenVM/committee integration, real router round-trip and the v2 UI
deployment profile are still release gates. The 11 September text below is kept
as historical evidence of how the implementation evolved; its “disabled” and
“unimplemented” statements no longer describe the current source.

## Historical 11 September core checkpoint

This is implemented local work, NOT a funded/deployed v2 application. The live
v1.1 contract and UI configuration are unchanged. User retains submission and
new-contract deployment approval. Wallet permission is not a waiver of tests.

## Implemented in Intelligent Contract source

`contracts/tasktrace_v2_core.py` used the original concrete runner hash. Its only
write entry point stores immutable **unfunded** draft terms with authenticated
client, distinct workers, chain/contract/deal domain and canonical terms hash.
It explicitly reports funding, external review and settlement as disabled.
No caller can submit a verdict/receipt to mark work paid.

Internal components now implemented and tested:

- Strict JSON: duplicate keys/nonfinite constants/trailing data rejected; no
  truthy-boolean, numeric-string or float coercion in authoritative fields.
- Contract-generated deterministic obligation IDs plus explicit semantic IDs;
  exactly complete report IDs, with no missing, duplicate or invented duties.
- Canonical provider identity commitment, immutable full commit, safe bounded
  path and explicit media type, whole byte length and SHA-256 limits.
- GitHub metadata verifier: stable owner/repository identity, commit-to-tree
  path chain, regular-file mode, blob identity, decoded Base64, Git blob SHA-1
  and full content SHA-256. Reject missing/extra trees, truncation, symlinks,
  submodules, executable artifacts, altered tails and provider identity changes.
- HTTP envelope schema/MIME/byte cap/status validation. A 3xx rejects, but this
  does not detect a hidden redirect already followed by the host. That gate is
  still open; these helpers are NOT an enabled external evidence adapter.
- Complete-artifact semantic input, strict candidates, unique grounded citation
  offsets in UTF-8 bytes, exact per-duty status/missing-ID comparison, independent
  acquisition/derivation followed by a separate grounding judgment. Contract
  callbacks use the official custom Equivalence Principle. Tests explicitly
  exercise both callbacks; this is not real protocol-selected committee proof.
- Exact receipt identity comparator, including chain/router/source/deal/role/
  sequence/terms/decision/key/recipient/amount/kind/RELEASED. Comparisons remain
  internal and cannot authenticate an arbitrary caller-supplied receipt.
- Fixed fee/bond/penalty entitlements with separate transfer kinds and value
  conservation, including the maximum fee+penalty refund boundary.

## EVM compatibility correction

The prior high-level SDK proxy failures remain reproducible and their tests
remain red. Found an official lower-level interface rather than editing the
SDK installation: `_genlayer_wasi.gl_call`, specified in the pinned release's
`_genlayer_wasi.pyi`, carrying documented `EthCall` and `EthSend` messages encoded
by `genlayer.py.calldata`.

The new narrow internal adapter uses those exact messages. It preserves the
requested value and target, reads a bounded response descriptor, handles the
documented no-result sentinel, and never calls an undocumented host message.
No changes to the runner, SDK, host implementation, network config, entitlement
policy or single-message funding architecture. This is a transport implementation
correction, not relocation of settlement logic. It has now passed execution in
the real pinned GenVM v0.2.12 binary against the official host protocol decoder.
The host was controlled and recorded one exact read and one exact send with value
123; this is not a live EVM router, committee or finality test.

The official v0.2.12 local web module was also exercised with a controlled
loopback redirect from `127.0.0.1` to `localhost`. Server logs prove both requests;
the IC received only the final status 200/body and the response exposed neither
URL nor history. This confirms the redirect gate is unavailable on this runner.
External acquisition remains disabled rather than trusting final bytes or moving
provenance authority to a backend.

References:

- [Official WASI message specification](https://sdk.genlayer.com/v0.2.14/spec/02-execution-environment/03-wasi_genlayer_sdk/02-gl_call.html)
- [Pinned Python WASI declarations](https://github.com/genlayerlabs/genvm/blob/ea1de32ffbcdec286e665f10043a124848901237/runners/genlayer-py-std/src/_genlayer_wasi.pyi)
- [Pinned executor EthCall/EthSend implementation](https://github.com/genlayerlabs/genvm/blob/ea1de32ffbcdec286e665f10043a124848901237/executor/src/wasi/genlayer_sdk.rs)
- [GitHub tree API](https://docs.github.com/en/rest/git/trees)
- [GitHub blob API](https://docs.github.com/en/rest/git/blobs)

## Verification and honest remaining scope

GenVM lint: 3 checks passed, no warnings; ABI: 1 write, 2 views.
Direct core suite: **144 passed**, `reports/v2-core.xml`.
Full local Python regression: **239 passed, 0 failed**, including v1 history,
v2 core/adversarial coverage and pinned-SDK safety diagnostics;
`reports/v2-regression.xml`. A passing safety diagnostic means the unsupported
external adapter remains closed, not that redirects are now safe.
One test-harness failure from an automatically generated oversized test ID was
fixed by explicit short test IDs; artifact limits/negative test unchanged. Raw
failed run retained in `reports/v2-core-long-test-id.xml`.

The IC now assembles the complete structured report privately and refuses to call
provenance `VERIFIED` from hash-valid bytes alone. Report provenance must exactly
match the committed provider/owner/repository/commit/blob/path/type/length/hash.
Accept, delivery and upstream obligations are stage-specific for A/B, and their
deterministic status participates in the contract-derived stage outcome.

Still unimplemented/unverified: enabled redirect-safe external acquisition,
public persisted consensus-report lifecycle and funded lifecycle/deadlines, native router
release/confirmation, real committee semantic/adversarial tests, actual worker
agents and final frontend integration/UX. Do not infer these are complete from
the helper tests or the number of passing cases.

Native test environment preparation uses official v0.2.12 release assets under
ignored `.cache/genvm-native-v0.2.12`. Linux binary relocation via upstream
post-install is installation only, not modifying GenVM logic or runner content.
No new chain transaction or public deployment is authorized by this checkpoint.

Frontend regression remains **2 receipt + 65 UI tests passed**. TypeScript and
the production Vite build pass. The primary 762.67 kB bundle was split into
bounded UI, GenLayer and EVM chunks (largest 285.22 kB); desktop and 390 px mobile
were visually checked with no horizontal overflow. The public UI still targets
the historical verified v1.1 contract and does not pretend the draft v2 core is
live.
