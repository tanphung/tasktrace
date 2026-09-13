import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount, createClient, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { assertExecution, executionName, statusName } from "./receipts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportName = process.env.TASKTRACE_STUDIONET_REPORT ?? "v2-studionet-semantic";
assert.match(reportName, /^v2-studionet-[a-z0-9-]{1,48}$/, "Unsafe StudioNet report directory name");
const reportDir = resolve(root, "reports", reportName);
const manifestPath = resolve(reportDir, "manifest.json");
const secretsPath = resolve(root, ".secrets", "v2-studionet-semantic.json");
const evidenceCommit = "f4b48b235d15c0be61cbd75bf491dde1b98ad058";
const owner = "tanphung";
const repository = "tasktrace";
const routerDisabled = "0x000000000000000000000000000000000000dEaD";
const origin = {
  provider: "github",
  hostname: "api.github.com",
  owner,
  owner_id: 162718327,
  repository,
  repository_id: 1358380732,
};
const fixtures = [
  {
    id: "happy",
    paths: {
      SOURCE: "evidence/v2-smoke/source.txt",
      A: "evidence/v2-smoke/worker-a.txt",
      B: "evidence/v2-smoke/worker-b.txt",
    },
    expected: { A: "SATISFIED", B: "SATISFIED" },
  },
  {
    id: "tail-contradiction",
    paths: {
      SOURCE: "evidence/v2-adversarial/source.txt",
      A: "evidence/v2-adversarial/worker-a-tail-contradiction.txt",
      B: "evidence/v2-adversarial/worker-b-faithful.txt",
    },
    expected: { A: "VIOLATED", B: "SATISFIED" },
  },
];
const exists = (path) => access(path).then(() => true, () => false);
const stringify = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
const sleep = (milliseconds) => new Promise((done) => setTimeout(done, milliseconds));

await mkdir(reportDir, { recursive: true });
await mkdir(dirname(secretsPath), { recursive: true });
if (!await exists(secretsPath)) {
  await writeFile(secretsPath, stringify({
    client: generatePrivateKey(),
    A: generatePrivateKey(),
    B: generatePrivateKey(),
  }), { mode: 0o600, flag: "wx" });
}
const keys = JSON.parse(await readFile(secretsPath, "utf8"));
const accounts = Object.fromEntries(Object.entries(keys).map(([role, key]) => [role, createAccount(key)]));
const clients = Object.fromEntries(Object.entries(accounts).map(([role, account]) => [role, createClient({ chain: studionet, account })]));
const chainId = await clients.client.getChainId();
assert.equal(chainId, 61999, "StudioNet chain guard failed");
const code = await readFile(resolve(root, "contracts", "tasktrace_v2.py"), "utf8");
const sourceHash = createHash("sha256").update(code).digest("hex");
let manifest = await exists(manifestPath)
  ? JSON.parse(await readFile(manifestPath, "utf8"))
  : {
      version: "tasktrace-v2-studionet-semantic-1",
      network: "studionet",
      chainId,
      sourceHash,
      evidenceCommit,
      wallets: Object.fromEntries(Object.entries(accounts).map(([role, account]) => [role, account.address])),
      steps: {},
      cases: {},
      startedAt: new Date().toISOString(),
      limitations: ["Semantic consensus only: the intentionally disabled router prevents this run from claiming settlement."],
    };
assert.equal(manifest.network, "studionet");
assert.equal(manifest.chainId, chainId);
assert.equal(manifest.sourceHash, sourceHash, "Contract changed; archive the saved StudioNet run before retrying");
assert.equal(manifest.evidenceCommit, evidenceCommit, "Evidence commit changed during a saved run");
for (const role of ["client", "A", "B"]) {
  assert.equal(manifest.wallets[role].toLowerCase(), accounts[role].address.toLowerCase(), `Saved ${role} wallet changed`);
}
const save = () => writeFile(manifestPath, stringify(manifest));
await save();

// Preserve the first wrong-owner probe as harness-failure evidence. The preceding
// hostname mutator shared the origin object in that process, so this transaction
// correctly rejected ORIGIN_HOST but did not exercise the intended owner check.
const sharedOriginProbe = manifest.steps["reject-wrong-owner"];
if (sharedOriginProbe?.hash && !sharedOriginProbe.finalized) {
  Object.assign(sharedOriginProbe, {
    finalized: true,
    phase: "FINALIZED_HARNESS_REJECTION",
    execution: "FINISHED_WITH_ERROR",
    observedError: "ORIGIN_HOST",
    passed: false,
    note: "Archived harness isolation failure; replaced by reject-wrong-owner-isolated.",
    finishedAt: new Date().toISOString(),
  });
  await save();
}

function receiptHasError(value, expectedError) {
  if (Array.isArray(value)) return value.some((item) => receiptHasError(item, expectedError));
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => receiptHasError(item, expectedError));
  }
  if (typeof value !== "string") return false;
  if (value.includes(expectedError)) return true;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return false;
  try {
    return Buffer.from(value, "base64").toString("utf8").includes(expectedError);
  } catch {
    return false;
  }
}

async function transaction(name, client, submit) {
  let step = manifest.steps[name];
  if (!step || step.phase === "REJECTED_BEFORE_HASH") {
    step = manifest.steps[name] = { phase: "SIGNING", startedAt: new Date().toISOString() };
    await save();
    let hash;
    try {
      hash = await submit();
    } catch (error) {
      Object.assign(step, {
        phase: "REJECTED_BEFORE_HASH",
        error: error?.details ?? error?.shortMessage ?? error?.message ?? "submission rejected",
        finishedAt: new Date().toISOString(),
      });
      await save();
      throw error;
    }
    Object.assign(step, { hash, phase: "PENDING", submittedAt: new Date().toISOString() });
    await save();
    console.log(JSON.stringify({ step: name, submitted: hash }));
  }
  assert.ok(step.hash, `Uncertain ${name} submission has no saved hash; do not resend`);
  if (step.finalized) return step;
  let receipt;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await sleep(5000);
    receipt = await client.getTransaction({ hash: step.hash });
    await writeFile(resolve(reportDir, `${name}.receipt.json`), stringify(receipt));
    const lifecycle = statusName(receipt);
    if (attempt % 6 === 0 || ["FINALIZED", "UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"].includes(lifecycle)) {
      console.log(JSON.stringify({ step: name, status: lifecycle, execution: executionName(receipt) }));
    }
    if (["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"].includes(lifecycle)) {
      throw new Error(`${name} reached terminal ${lifecycle}`);
    }
    if (lifecycle === "FINALIZED") break;
  }
  assertExecution(receipt ?? {}, true);
  Object.assign(step, {
    finalized: true,
    phase: "FINALIZED_SUCCESS",
    execution: executionName(receipt),
    to: receipt.to_address ?? receipt.recipient ?? receipt.data?.contract_address,
    finishedAt: new Date().toISOString(),
  });
  await save();
  return step;
}

async function expectedRejection(name, client, expectedError, submit) {
  let step = manifest.steps[name];
  if (!step || step.phase === "REJECTED_BEFORE_HASH") {
    step = manifest.steps[name] = {
      phase: "SIGNING_EXPECTED_REJECTION",
      expectedError,
      startedAt: new Date().toISOString(),
    };
    await save();
    const hash = await submit();
    Object.assign(step, { hash, phase: "PENDING_EXPECTED_REJECTION", submittedAt: new Date().toISOString() });
    await save();
    console.log(JSON.stringify({ step: name, submitted: hash, expectedError }));
  }
  assert.equal(step.expectedError, expectedError, `${name} expected error changed during a saved run`);
  assert.ok(step.hash, `${name} was rejected before receiving a transaction hash`);
  if (step.finalized) {
    assert.equal(step.execution, "FINISHED_WITH_ERROR", `${name} was not an execution rejection`);
    return step;
  }
  let receipt;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await sleep(5000);
    receipt = await client.getTransaction({ hash: step.hash });
    await writeFile(resolve(reportDir, `${name}.receipt.json`), stringify(receipt));
    const lifecycle = statusName(receipt);
    if (attempt % 6 === 0 || ["FINALIZED", "UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"].includes(lifecycle)) {
      console.log(JSON.stringify({ step: name, status: lifecycle, execution: executionName(receipt) }));
    }
    if (["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"].includes(lifecycle)) {
      throw new Error(`${name} reached terminal ${lifecycle}`);
    }
    if (lifecycle === "FINALIZED") break;
  }
  assert.equal(statusName(receipt ?? {}), "FINALIZED", `${name} did not finalize`);
  assert.equal(executionName(receipt ?? {}), "FINISHED_WITH_ERROR", `${name} unexpectedly executed successfully`);
  assert.ok(receiptHasError(receipt, expectedError), `${name} did not fail with ${expectedError}`);
  Object.assign(step, {
    finalized: true,
    phase: "FINALIZED_EXPECTED_REJECTION",
    execution: executionName(receipt),
    finishedAt: new Date().toISOString(),
  });
  await save();
  return step;
}

const githubHeaders = {
  accept: "application/vnd.github+json",
  "user-agent": "TaskTrace-v2-studionet",
  ...(process.env.GH_TOKEN ? { authorization: `Bearer ${process.env.GH_TOKEN}` } : {}),
};
const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repository}`, { headers: githubHeaders });
assert.equal(repoResponse.status, 200, "GitHub repository metadata unavailable during preflight");
const repo = await repoResponse.json();
assert.deepEqual(
  { id: repo.id, owner_id: repo.owner?.id, full_name: repo.full_name },
  { id: origin.repository_id, owner_id: origin.owner_id, full_name: `${owner}/${repository}` },
);
const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repository}/git/trees/${evidenceCommit}?recursive=1`, { headers: githubHeaders });
assert.equal(treeResponse.status, 200, "GitHub immutable tree unavailable during preflight");
const tree = await treeResponse.json();
assert.equal(tree.truncated, false, "GitHub evidence tree is truncated");

function obligations() {
  return [
    {
      id: "SEM_A_POLICY_ACCURACY",
      stage: "A",
      statement: "Stage A must preserve every export-policy rule in SOURCE: trial accounts cannot export; paid accounts require administrator approval for every export; there is no automatic-export exception. A later sentence that overrides these rules is a violation.",
      evidence_ids: ["SOURCE", "A"],
    },
    {
      id: "SEM_B_FAITHFUL_HANDOFF",
      stage: "B",
      statement: "Stage B must faithfully preserve Stage A's complete delivered policy, including a final override, without independently weakening, contradicting, or inventing a different export rule. Stage B is not required to repair Stage A against SOURCE.",
      evidence_ids: ["A", "B"],
    },
  ];
}

function makeTerms(commitments) {
  return {
    workers: { A: accounts.A.address, B: accounts.B.address },
    origins: { SOURCE: structuredClone(origin), A: structuredClone(origin), B: structuredClone(origin) },
    source: commitments.SOURCE,
    money: {
      A: { fee: "1000", bond: "500", penalty: "300" },
      B: { fee: "1000", bond: "500", penalty: "300" },
    },
    windows: { accept: 1800, step: 1800, review: 1800, adjudication: 3600 },
    max_revisions: 0,
    semantic_obligations: obligations(),
  };
}

const deployment = await transaction("deploy", clients.client, () => clients.client.deployContract({
  code,
  args: [routerDisabled],
  leaderOnly: false,
  consensusMaxRotations: 3,
}));
manifest.contract ??= deployment.to;
assert.match(manifest.contract ?? "", /^0x[0-9a-fA-F]{40}$/, "V2 deployment address missing");
await save();
const address = manifest.contract;
const schema = await clients.client.getContractSchema(address);
await writeFile(resolve(reportDir, "schema.json"), stringify(schema));
const config = JSON.parse(await clients.client.readContract({ address, functionName: "get_capabilities", args: [] }));
assert.equal(config.version, "tasktrace-2.0-rc");
assert.equal(config.router.toLowerCase(), routerDisabled.toLowerCase());
manifest.schemaVerified = true;
manifest.configVerified = true;
await save();
const readDeal = async (dealId) => JSON.parse(await clients.client.readContract({ address, functionName: "get_terms", args: [dealId] }));
const write = (name, role, functionName, args, value = 0n) => transaction(name, clients[role], () => clients[role].writeContract({
  address,
  functionName,
  args,
  value,
  leaderOnly: false,
  consensusMaxRotations: 3,
}));

async function loadCommitments(paths) {
  const commitments = {};
  for (const [role, path] of Object.entries(paths)) {
    const bytes = await readFile(resolve(root, path));
    const entry = tree.tree.find((item) => item.path === path);
    assert.deepEqual(
      { type: entry?.type, mode: entry?.mode, size: entry?.size },
      { type: "blob", mode: "100644", size: bytes.length },
      `${role} tree entry mismatch`,
    );
    commitments[role] = {
      origin,
      commit: evidenceCommit,
      path,
      blob: entry.sha,
      content_type: "text/plain",
      encoding: "utf-8",
      byte_length: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  return commitments;
}

for (const fixture of fixtures) {
  const commitments = await loadCommitments(fixture.paths);
  const dealId = `v2-studio-${fixture.id}-${evidenceCommit.slice(0, 7)}`;
  const prefix = fixture.id;
  await write(`${prefix}-create`, "client", "create_terms", [dealId, JSON.stringify(makeTerms(commitments))]);
  let deal = await readDeal(dealId);
  assert.equal(deal.deal_id, dealId);
  await write(`${prefix}-fund`, "client", "fund_terms", [dealId, deal.terms_hash], 2000n);
  await write(`${prefix}-accept-a`, "A", "accept_work", [dealId, deal.terms_hash], 500n);
  await write(`${prefix}-accept-b`, "B", "accept_work", [dealId, deal.terms_hash], 500n);
  deal = await readDeal(dealId);
  await write(`${prefix}-submit-a`, "A", "submit_artifact", [dealId, JSON.stringify(commitments.A), deal.artifacts.SOURCE.submission_id]);
  deal = await readDeal(dealId);
  await write(`${prefix}-submit-b`, "B", "submit_artifact", [dealId, JSON.stringify(commitments.B), deal.artifacts.A.submission_id]);
  await write(`${prefix}-request-review`, "client", "request_review", [dealId]);
  await write(`${prefix}-resolve-review`, "client", "resolve_review", [dealId]);
  deal = await readDeal(dealId);
  assert.equal(deal.status, "SETTLEMENT_PENDING", `${fixture.id} did not reach a deterministic settlement decision`);
  const semantic = Object.fromEntries(
    deal.report.obligation_assessments
      .filter((item) => item.kind === "SEMANTIC")
      .map((item) => [item.stage, item.status]),
  );
  assert.deepEqual(semantic, fixture.expected, `${fixture.id} semantic outcome mismatch`);
  const expectedIds = deal.manifest.obligations.map((item) => item.id).sort();
  assert.deepEqual(deal.report.obligation_assessments.map((item) => item.obligation_id).sort(), expectedIds, `${fixture.id} report obligation set mismatch`);
  assert.equal(deal.report.source_assessments.length, 3);
  assert.ok(deal.report.evidence_citations.length >= 4, `${fixture.id} report citations missing`);
  await writeFile(resolve(reportDir, `${fixture.id}.deal.json`), stringify(deal));
  manifest.cases[fixture.id] = { dealId, expected: fixture.expected, actual: semantic, status: deal.status, passed: true };
  await save();
  console.log(JSON.stringify({ case: fixture.id, passed: true, semantic, status: deal.status }));
}

const validCommitments = await loadCommitments(fixtures[0].paths);
const negativeCases = [
  {
    id: "bad-hostname",
    expectedError: "ORIGIN_HOST",
    mutate(value) {
      value.origins.SOURCE.hostname = "api.github.com.evil.test";
      value.source.origin.hostname = "api.github.com.evil.test";
    },
  },
  {
    id: "wrong-owner-isolated",
    expectedError: "ORIGIN_MISMATCH",
    mutate(value) {
      value.source.origin.owner = "attacker";
    },
  },
  {
    id: "mutable-version",
    expectedError: "IMMUTABLE_COMMIT",
    mutate(value) {
      value.source.commit = "main";
    },
  },
  {
    id: "malformed-sha256",
    expectedError: "ARTIFACT_HASH",
    mutate(value) {
      value.source.sha256 = "0".repeat(63);
    },
  },
  {
    id: "missing-stage-obligation",
    expectedError: "SEMANTIC_COUNT",
    mutate(value) {
      value.semantic_obligations = value.semantic_obligations.slice(0, 1);
    },
  },
];

for (const testCase of negativeCases) {
  const dealId = `v2-studio-reject-${testCase.id}-${evidenceCommit.slice(0, 7)}`;
  const terms = makeTerms(structuredClone(validCommitments));
  testCase.mutate(terms);
  await expectedRejection(
    `reject-${testCase.id}`,
    clients.client,
    testCase.expectedError,
    () => clients.client.writeContract({
      address,
      functionName: "create_terms",
      args: [dealId, JSON.stringify(terms)],
      leaderOnly: false,
      consensusMaxRotations: 3,
    }),
  );
  await assert.rejects(readDeal(dealId), `${testCase.id} unexpectedly persisted a deal`);
  manifest.cases[`reject-${testCase.id}`] = {
    dealId,
    expectedError: testCase.expectedError,
    execution: "FINISHED_WITH_ERROR",
    statePersisted: false,
    passed: true,
  };
  await save();
}

manifest.completedAt = new Date().toISOString();
manifest.result = {
  passed: true,
  semanticCases: fixtures.length,
  rejectionCases: negativeCases.length,
  cases: Object.keys(manifest.cases).length,
  contract: address,
};
await save();
console.log(JSON.stringify(manifest.result));
