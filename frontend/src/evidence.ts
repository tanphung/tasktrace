import type {Artifact,Job} from './types';

const encoder = new TextEncoder();
export function canonical(value:unknown):string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value === 'object') return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,v])=>JSON.stringify(key)+':'+canonical(v)).join(',')+'}';
  return JSON.stringify(value);
}
export async function digest(text:string):Promise<string> {
  const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(text));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function chunks(artifact:Artifact) {
  const result:{id:string;content:string;start:number;end:number}[]=[];
  let content='',size=0,start=0;
  for(const char of artifact.content) {
    const length=encoder.encode(char).length;
    if(size+length>2048){result.push({id:`${artifact.role}:1:${result.length}`,content,start,end:start+size});start+=size;content='';size=0;}
    content+=char;size+=length;
  }
  if(content) result.push({id:`${artifact.role}:1:${result.length}`,content,start,end:start+size});
  return result;
}
function requireEvidence(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(`Evidence integrity: ${message}`);}

export function verifyLedger(job:Job):void {
  const integer=(value:string)=>{requireEvidence(typeof value==='string'&&/^\d+$/.test(value),'invalid money');return BigInt(value);};
  const amounts=job.terms.money;
  const fees=integer(amounts.A.fee)+integer(amounts.B.fee);
  const received=fees+(job.accepted.A?integer(amounts.A.bond):0n)+(job.accepted.B?integer(amounts.B.bond):0n);
  requireEvidence(integer(job.ledger.received)===received,'received deposits mismatch');
  const settled=['RESOLVED','CANCELLED'].includes(job.status);
  const original={CLIENT:0n,A:0n,B:0n};
  if(job.status==='CANCELLED'){
    original.CLIENT=fees;original.A=job.accepted.A?integer(amounts.A.bond):0n;original.B=job.accepted.B?integer(amounts.B.bond):0n;
  }else if(job.status==='RESOLVED'){
    requireEvidence(job.outcomes,'missing settlement outcomes');
    for(const role of ['A','B'] as const){
      const {fee,bond,penalty}=amounts[role],f=integer(fee),b=integer(bond),p=integer(penalty);
      requireEvidence(p<=b,'penalty exceeds bond');
      const result=job.outcomes[role];requireEvidence(['SATISFIED','VIOLATED','UNASSESSABLE'].includes(result),'invalid settlement outcome');
      original[role]=result==='SATISFIED'?f+b:result==='VIOLATED'?b-p:b;
      original.CLIENT+=result==='SATISFIED'?0n:result==='VIOLATED'?f+p:f;
    }
  }
  let emitted=0n,credits=0n;
  for(const role of ['CLIENT','A','B'] as const){
    const claim=job.claims[role];
    if(claim){
      requireEvidence(settled&&original[role]>0n&&integer(claim.amount)===original[role],'claim amount mismatch');
      requireEvidence(claim.recipient===(role==='CLIENT'?job.client:job.workers[role])&&claim.settlement_id===`${job.id}:${role}:1`&&claim.kind===job.settlement_reason&&claim.state==='MESSAGE_EMITTED','claim identity mismatch');
      emitted+=original[role];
    }
    const credit=integer(job.ledger.credits[role]);credits+=credit;
    requireEvidence(credit===(claim?0n:original[role]),'credit allocation mismatch');
  }
  requireEvidence(integer(job.ledger.issued)===(settled?received:0n)&&integer(job.ledger.emitted)===emitted&&credits+emitted===(settled?received:0n),'ledger conservation mismatch');
}

export async function verifyArtifacts(job:Job):Promise<void> {
  let total=0;
  for (const role of ['SOURCE','A','B'] as const) {
    const artifact=job.artifacts[role];
    if(!artifact){requireEvidence(role!=='SOURCE','missing source');continue;}
    requireEvidence(typeof artifact.content==='string','invalid document');
    const size=encoder.encode(artifact.content).length;total+=size;
    requireEvidence(size>0&&size<=4096&&size===artifact.byte_length,'byte length mismatch');
    const issuer=role==='SOURCE'?job.client:job.workers[role];
    const upstream=role==='SOURCE'?'':job.artifacts[role==='A'?'SOURCE':'A']?.submission_id;
    requireEvidence(artifact.role===role&&artifact.issuer===issuer&&artifact.upstream===upstream,'role or upstream mismatch');
    requireEvidence(artifact.job_id===job.id&&artifact.contract===job.contract&&artifact.chain_id===job.chain_id&&artifact.revision===1,'domain mismatch');
    requireEvidence(artifact.encoding==='utf-8'&&artifact.content_type==='text/plain','unsupported encoding/type');
    requireEvidence(await digest(artifact.content)===artifact.sha256,'whole-document hash mismatch');
    const {content:_,submission_id,...identity}=artifact;
    requireEvidence(await digest(canonical(identity))===submission_id,'submission identity mismatch');
  }
  requireEvidence(total<=8192,'total size exceeded');
  const termsHash=await digest(canonical({terms:job.terms,source:job.artifacts.SOURCE!.submission_id,job:job.id,workers:job.workers,client:job.client,accept_deadline:job.accept_deadline}));
  requireEvidence(termsHash===job.terms_hash,'accepted terms hash mismatch');
  verifyLedger(job);
  if(!job.review)return;
  requireEvidence(job.review.terms_hash===job.terms_hash,'review terms mismatch');
  const all=(['SOURCE','A','B'] as const).flatMap(role=>job.artifacts[role]?chunks(job.artifacts[role]!):[]);
  requireEvidence(canonical(job.review.result.reviewed_chunks)===canonical(all.map(c=>c.id)),'review does not cover all chunks');
  const expected=['A_MEANING','A_COVERAGE',...(!job.b_missing?['B_FAITHFULNESS','B_COVERAGE',...(job.terms.verify_source?['B_SOURCE']:[])]:[])];
  requireEvidence(canonical(job.review.result.assessments.map(a=>a.obligation_id))===canonical(expected),'obligation sequence mismatch');
  for(const assessment of job.review.result.assessments){
    requireEvidence(['SATISFIED','VIOLATED','UNASSESSABLE'].includes(assessment.status),'unknown assessment status');
    const required=assessment.obligation_id==='B_SOURCE'?['SOURCE','B']:assessment.obligation_id.startsWith('A_')?['SOURCE','A']:['A','B'];
    const roles=new Set<string>();
    requireEvidence(assessment.citations.length>=1&&assessment.citations.length<=4,'citation count');
    const seen=new Set<string>();
    for(const cite of assessment.citations){
      const chunk=all.find(c=>c.id===cite.chunk_id);
      requireEvidence(chunk,'unknown citation chunk');
      const at=chunk.content.indexOf(cite.quote);
      const byteLength=encoder.encode(cite.quote).length;
      requireEvidence(byteLength>0&&byteLength<=500&&at>=0,'quote missing from full artifact');
      const start=chunk.start+encoder.encode(chunk.content.slice(0,at)).length;
      requireEvidence(cite.start_byte===start&&cite.end_byte===start+byteLength,'citation byte offset mismatch');
      requireEvidence(cite.chunk_sha256===await digest(chunk.content),'citation chunk hash mismatch');
      const key=canonical([cite.chunk_id,cite.quote]);requireEvidence(!seen.has(key),'duplicate citation');seen.add(key);
      const role=cite.chunk_id.split(':')[0];requireEvidence(required.includes(role),'unrelated citation');roles.add(role);
    }
    requireEvidence(assessment.status==='UNASSESSABLE'||required.every(r=>roles.has(r)),'missing source/deliverable citation');
  }
}
