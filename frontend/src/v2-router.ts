import {createPublicClient,createWalletClient,custom,http} from "viem";
import type {Address,Hash} from "viem";
import {chain} from "./client";
import {friendlyError} from "./errors";

export const routerAbi=[{type:"function",name:"release",stateMutability:"nonpayable",inputs:[{name:"sourceContract",type:"address"},{name:"receiptId",type:"bytes32"}],outputs:[]},{type:"function",name:"receiptState",stateMutability:"view",inputs:[{name:"sourceContract",type:"address"},{name:"receiptId",type:"bytes32"}],outputs:[{type:"uint8"}]}] as const;
export type RouterPhase="SIGNING"|"PENDING"|"FINALIZED_SUCCESS"|"FAILED"|"REJECTED"|"UNKNOWN";
export type RouterRecord={id:string;dealId:string;receiptId:string;sourceContract:string;account:string;chainId:number;router:string;phase:RouterPhase;hash?:Hash;error?:string;createdAt:number};
const pending=(record:RouterRecord)=>["SIGNING","PENDING","UNKNOWN"].includes(record.phase);
export const routerHistoryKey=(router:string)=>`tasktrace:v2:router:${chain.id}:${router.toLowerCase()}`;

export function routerHistory(router:string):RouterRecord[]{
  const raw=localStorage.getItem(routerHistoryKey(router));if(!raw)return [];
  const value:unknown=JSON.parse(raw);
  const valid=Array.isArray(value)&&value.every(item=>item&&item.chainId===chain.id&&typeof item.router==="string"&&item.router.toLowerCase()===router.toLowerCase()&&typeof item.id==="string"&&typeof item.dealId==="string"&&/^[\da-f]{64}$/i.test(item.receiptId)&&/^0x[\da-f]{40}$/i.test(item.sourceContract)&&/^0x[\da-f]{40}$/i.test(item.account)&&typeof item.createdAt==="number"&&["SIGNING","PENDING","FINALIZED_SUCCESS","FAILED","REJECTED","UNKNOWN"].includes(item.phase)&&(item.hash===undefined||/^0x[\da-f]{64}$/i.test(item.hash)));
  if(!valid)throw new Error("Invalid receipt-release journal. Check the wallet before attempting another release.");
  return value as RouterRecord[];
}
function save(record:RouterRecord){
  const rows=routerHistory(record.router),index=rows.findIndex(item=>item.id===record.id);
  if(index<0)rows.unshift(record);else rows[index]=record;
  localStorage.setItem(routerHistoryKey(record.router),JSON.stringify(rows));
  window.dispatchEvent(new Event("tasktrace:v2-router"));
}
function provider(){
  const value=(window as unknown as {ethereum?:{request:(args:{method:string;params?:unknown[]})=>Promise<unknown>}}).ethereum;
  if(!value?.request)throw new Error("MetaMask is required to release the exact router receipt");
  return value;
}

export async function releaseRouterReceipt(router:Address,sourceContract:Address,account:Address,dealId:string,receiptId:string):Promise<RouterRecord>{
  if(!navigator.locks)throw new Error("Web Locks are required to prevent duplicate receipt releases");
  const key=routerHistoryKey(router);
  return navigator.locks.request(key,{ifAvailable:true},async lock=>{
    if(!lock||routerHistory(router).some(pending))throw new Error("A receipt release is unresolved. Check its saved hash before signing again.");
    const ethereum=provider(),accounts=await ethereum.request({method:"eth_accounts"}) as string[];
    if(accounts[0]?.toLowerCase()!==account.toLowerCase())throw new Error("Wallet account changed. Reconnect before signing.");
    if(Number(await ethereum.request({method:"eth_chainId"}))!==chain.id)throw new Error(`Switch the wallet to ${chain.name}`);
    const record:RouterRecord={id:crypto.randomUUID(),dealId,receiptId,sourceContract,account,chainId:chain.id,router,phase:"SIGNING",createdAt:Date.now()};save(record);
    try{
      const publicClient=createPublicClient({chain,transport:http(chain.rpcUrls.default.http[0])});
      const wallet=createWalletClient({chain,account,transport:custom(ethereum)});
      const {request}=await publicClient.simulateContract({address:router,abi:routerAbi,functionName:"release",args:[sourceContract,`0x${receiptId}`],account});
      record.hash=await wallet.writeContract(request);record.phase="PENDING";save(record);
      const receipt=await publicClient.waitForTransactionReceipt({hash:record.hash});
      record.phase=receipt.status==="success"?"FINALIZED_SUCCESS":"FAILED";
      if(record.phase==="FAILED")record.error="Receipt release reverted";
      save(record);return record;
    }catch(cause){
      const raw=cause as {code?:number;cause?:unknown};let current:typeof raw|undefined=raw,rejected=false;
      for(let depth=0;current&&depth<6;depth++){if(current.code===4001)rejected=true;current=current.cause as typeof raw;}
      record.phase=rejected?"REJECTED":record.hash?"UNKNOWN":"FAILED";
      record.error=rejected?"Signature rejected. No transaction was sent.":record.hash?"Receipt release outcome is uncertain. Check the saved hash; do not resend.":friendlyError(cause,"Receipt release failed");
      save(record);throw new Error(record.error);
    }
  });
}

export async function observeRouter(router:string):Promise<RouterRecord[]>{
  const publicClient=createPublicClient({chain,transport:http(chain.rpcUrls.default.http[0])});
  const rows=routerHistory(router);
  for(const record of rows.filter(item=>item.hash&&pending(item))){
    try{const receipt=await publicClient.getTransactionReceipt({hash:record.hash!});record.phase=receipt.status==="success"?"FINALIZED_SUCCESS":"FAILED";if(record.phase==="FAILED")record.error="Receipt release reverted";save(record);}catch{/* Pending or temporarily unreadable: retain the same hash. */}
  }
  return routerHistory(router);
}
