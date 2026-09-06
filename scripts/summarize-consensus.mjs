// Read-only diagnostic: never calls an RPC, signs, or changes a saved receipt.
import {readFile} from 'node:fs/promises';
import {abi} from 'genlayer-js';

const path=process.argv[2];
if(!path)throw new Error('Usage: node scripts/summarize-consensus.mjs <receipt.json>');
const receipt=JSON.parse(await readFile(path,'utf8'));
const plain=value=>value instanceof Map?Object.fromEntries([...value].map(([key,item])=>[key,plain(item)])):Array.isArray(value)?value.map(plain):value;
function candidate(item){
  const output=item.eq_outputs?.['0'];
  try{
    const raw=output?.payload?.raw;
    // Historical receipts may retain base64 rather than expanded SDK calldata.
    const historical=typeof output==='string'?Buffer.from(output,'base64'):undefined;
    const bytes=Array.isArray(raw)?Uint8Array.from(raw):historical?.[0]===0?historical.subarray(1):undefined;
    if(!bytes)return {available:false};
    const result=plain(abi.calldata.decode(bytes));
    return {available:true,assessments:result.assessments?.map(({obligation_id,status,reason})=>({obligation_id,status,reason}))};
  }catch{return {available:false};}
}
const summarize=item=>({vote:item.vote,execution:item.execution_result,disagreementBlock:item.nondet_disagree});
console.log(JSON.stringify({hash:receipt.hash,status:receipt.statusName??receipt.status,rotations:receipt.rotation_count,rounds:(receipt.consensus_history?.consensus_results??[]).map((round,index)=>({index,phase:round.consensus_round,leaders:round.leader_result.map(item=>({...summarize(item),candidate:candidate(item)})),validators:round.validator_results.map(summarize)})),limitation:'A rejected validator callback does not disclose whether parsing, independent verdict comparison, or grounding rejected the candidate. Leader execution success is not consensus success.'},null,2));
