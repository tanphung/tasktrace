import {render,screen} from "@testing-library/react";
import {describe,expect,it} from "vitest";
import {contract,evidenceChainId} from "../../frontend/src/client";
import {validateV2Deal} from "../../frontend/src/v2-client";
import {V2Report} from "../../frontend/src/V2Report";
import type {V2Deal,V2Report as Report,V2SourceAssessment} from "../../frontend/src/v2-types";

const hash="a".repeat(64),commit="b".repeat(40),router=`0x${"44".repeat(20)}`;
const origin={provider:"github" as const,hostname:"api.github.com" as const,owner:"tanphung",owner_id:1,repository:"tasktrace",repository_id:2};
const commitment={origin,commit,path:"evidence/a.txt",blob:"c".repeat(40),content_type:"text/plain" as const,encoding:"utf-8" as const,byte_length:10,sha256:hash};
const obligations=[
  {id:"SEM_A_TEST",kind:"SEMANTIC" as const,stage:"A" as const,statement:"A test",evidence_ids:["SOURCE","A"] as const},
  {id:"SYS_REVIEW",kind:"DETERMINISTIC" as const,parameters:{seconds:60}},
];
function fixture():V2Deal{return {
  deal_id:"deal-1",chain_id:Number(evidenceChainId),contract,router,status:"REVIEW_REQUESTED",terms_hash:hash,accepted:{A:true,B:true},
  manifest:{version:"tasktrace-2.0-rc",chain_domain:evidenceChainId,contract,router,deal_id:"deal-1",client:`0x${"11".repeat(20)}`,
    terms:{workers:{A:`0x${"22".repeat(20)}`,B:`0x${"33".repeat(20)}`},origins:{SOURCE:origin,A:origin,B:origin},source:commitment,money:{A:{fee:"10",bond:"5",penalty:"3"},B:{fee:"10",bond:"5",penalty:"3"}},windows:{accept:60,step:60,review:60,adjudication:60},max_revisions:0,semantic_obligations:[{id:"SEM_A_TEST",stage:"A",statement:"A test",evidence_ids:["SOURCE","A"]}]},
    obligations:obligations.map(item=>({...item,evidence_ids:item.evidence_ids?[...item.evidence_ids]:undefined}))},
  artifacts:{},ledger:{received:"30",routed:"0",confirmed:"0"},settlement_legs:[],
};}
function report():Report{
  const sources=(["SOURCE","A","B"] as const).map((artifact_id):V2SourceAssessment=>({artifact_id,adapter:"github-commit-v1",...origin,commit,blob:commit,path:`evidence/${artifact_id}.txt`,content_type:"text/plain",byte_length:10,sha256:hash,status:"VERIFIED"}));
  return {schema_version:"tasktrace-report-2",chain_domain:evidenceChainId,contract,job_id:"deal-1",review_id:hash,revision:0,terms_hash:hash,evidence_manifest_hash:hash,reviewed_at:"1",source_assessments:sources,
    obligation_assessments:obligations.map(item=>({obligation_id:item.id,kind:item.kind,stage:item.stage??null,status:"SATISFIED",applicable:true,reason:"Verified",citation_ids:[],missing_evidence_ids:[]})),findings:[],reasoning:"Contract result",evidence_citations:[],missing_items:[],score:{A:10000,B:10000},decision:{stages:{A:{outcome:"SATISFIED",entitlements:{PAYOUT:"10",REFUND:"0",BOND_RETURN:"5"}},B:{outcome:"SATISFIED",entitlements:{PAYOUT:"10",REFUND:"0",BOND_RETURN:"5"}}},next_state:"READY_FOR_SETTLEMENT"}};
}

describe("TaskTrace v2 finalized-state renderer",()=>{
  it("does not invent a report while consensus is pending",()=>{render(<V2Report deal={fixture()}/>);expect(screen.getByText("No authoritative report yet")).toBeInTheDocument();expect(screen.queryByText("100%")).not.toBeInTheDocument();});
  it("accepts a report only when it covers the exact frozen obligation set",()=>{const deal=fixture();deal.report=report();expect(validateV2Deal(deal,"deal-1")).toBe(deal);deal.report.obligation_assessments.pop();expect(()=>validateV2Deal(deal,"deal-1")).toThrow("exact obligation set");});
  it("rejects a source assessment outside the canonical GitHub API host",()=>{const deal=fixture();deal.report=report();deal.report.source_assessments[0].hostname="github.com" as "api.github.com";expect(()=>validateV2Deal(deal,"deal-1")).toThrow("source provenance");});
});
