import {createHash} from "node:crypto";
import {afterEach, describe, expect, it, vi} from "vitest";
import {acquireArtifact} from "../../worker/src/github";
import type {Commitment, Env} from "../../worker/src/types";

const content = "Full artifact opening.\nFinal contradiction remains visible.";
const bytes = Buffer.from(content);
const blob = createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest("hex");
const origin = {provider: "github" as const, hostname: "api.github.com" as const, owner: "tanphung", owner_id: 10, repository: "tasktrace-evidence", repository_id: 20};
const commitment: Commitment = {origin, commit: "a".repeat(40), path: "source.md", blob, content_type: "text/markdown", encoding: "utf-8", byte_length: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex")};
const env = {GITHUB_EVIDENCE_TOKEN: "test"} as Env;

afterEach(() => vi.unstubAllGlobals());

describe("GitHub immutable acquisition", () => {
  it("checks exact repository identity and complete bytes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({id: 20, name: origin.repository, full_name: `${origin.owner}/${origin.repository}`, private: false, default_branch: "main", owner: {id: 10, login: origin.owner}}), {status: 200, headers: {"content-type": "application/json"}}))
      .mockResolvedValueOnce(new Response(JSON.stringify({type: "file", sha: blob, size: bytes.length, encoding: "base64", content: bytes.toString("base64")}), {status: 200, headers: {"content-type": "application/json"}}));
    vi.stubGlobal("fetch", fetchMock);
    await expect(acquireArtifact(env, commitment)).resolves.toBe(content);
    expect(fetchMock.mock.calls[1][0].toString()).toContain(`ref=${commitment.commit}`);
    expect(fetchMock.mock.calls[1][1].redirect).toBe("manual");
  });

  it("rejects redirects before accepting provider data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {status: 302, headers: {location: "https://evil.test/data", "content-type": "application/json"}})));
    await expect(acquireArtifact(env, commitment)).rejects.toThrow("redirect rejected");
  });

  it("rejects wrong immutable bytes even when the prefix looks valid", async () => {
    const tampered = Buffer.from("Full artifact opening.\nFinal clause silently changed.");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({id: 20, name: origin.repository, full_name: `${origin.owner}/${origin.repository}`, private: false, default_branch: "main", owner: {id: 10, login: origin.owner}}), {status: 200, headers: {"content-type": "application/json"}}))
      .mockResolvedValueOnce(new Response(JSON.stringify({type: "file", sha: blob, size: bytes.length, encoding: "base64", content: tampered.toString("base64")}), {status: 200, headers: {"content-type": "application/json"}})));
    await expect(acquireArtifact(env, commitment)).rejects.toThrow();
  });
});
