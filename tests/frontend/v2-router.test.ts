import {beforeEach,describe,expect,it} from "vitest";
import {chain} from "../../frontend/src/client";
import {routerHistory,routerHistoryKey} from "../../frontend/src/v2-router";

const router=`0x${"44".repeat(20)}`;
const valid={id:"release-1",dealId:"deal-1",receiptId:"aa".repeat(32),sourceContract:`0x${"33".repeat(20)}`,account:`0x${"11".repeat(20)}`,chainId:chain.id,router,phase:"PENDING",hash:`0x${"22".repeat(32)}`,createdAt:1};

describe("v2 receipt-release safety journal",()=>{
  beforeEach(()=>localStorage.clear());
  it("restores an exact pending router hash",()=>{localStorage.setItem(routerHistoryKey(router),JSON.stringify([valid]));expect(routerHistory(router)).toEqual([valid]);});
  it("rejects a record for another router",()=>{localStorage.setItem(routerHistoryKey(router),JSON.stringify([{...valid,router:`0x${"55".repeat(20)}`} ]));expect(()=>routerHistory(router)).toThrow("Invalid receipt-release journal");});
  it("rejects malformed receipt identities",()=>{localStorage.setItem(routerHistoryKey(router),JSON.stringify([{...valid,receiptId:"aa"}]));expect(()=>routerHistory(router)).toThrow("Invalid receipt-release journal");});
  it("rejects a missing receipt source namespace",()=>{const {sourceContract,...missing}=valid;void sourceContract;localStorage.setItem(routerHistoryKey(router),JSON.stringify([missing]));expect(()=>routerHistory(router)).toThrow("Invalid receipt-release journal");});
});
