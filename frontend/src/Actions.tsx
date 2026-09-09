import {useEffect,useState,type FormEvent} from 'react';
import {CalldataAddress,type Address,type CalldataEncodable} from 'genlayer-js/types';
import {hexToBytes,parseUnits} from 'viem';
import type {Job,Role} from './types';
import {label,money} from './Findings';
import {submit} from './transactions';
import {Terms} from './Terms';

export function validatePublicText(text:string,limit:number):number {
  const bytes=new TextEncoder().encode(text);
  if(!text.trim()||text.startsWith('\uFEFF')||new TextDecoder().decode(bytes)!==text||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))throw new Error('Use non-empty valid UTF-8 text without binary controls or a BOM.');
  if(bytes.length>limit)throw new Error(`Text exceeds the ${limit}-byte limit. Nothing was sent.`);
  return bytes.length;
}

export function roleOf(job:Job,address?:string):Role|undefined {
  if(!address)return;
  if(job.client.toLowerCase()===address.toLowerCase())return 'CLIENT';
  for(const role of ['A','B'] as const)if(job.workers[role].toLowerCase()===address.toLowerCase())return role;
}
export function deadline(job:Job):number|undefined {
  return ({FUNDED:job.accept_deadline,ACTIVE:job.a_deadline,A_SUBMITTED:job.b_deadline,REVIEWABLE:job.review_deadline,REVIEW_REQUESTED:job.adjudication_deadline,INCONCLUSIVE:job.adjudication_deadline} as Record<string,number|undefined>)[job.status];
}
export function Actions({job,account,busy,onSubmitted}:{job:Job;account?:Address;busy:boolean;onSubmitted:()=>void}){
  const [text,setText]=useState(''),[error,setError]=useState(''),[signing,setSigning]=useState(false),[accepted,setAccepted]=useState(false);
  const [now,setNow]=useState(()=>Date.now()/1000);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()/1000),1000);return()=>clearInterval(timer);},[]);
  const role=roleOf(job,account),due=deadline(job),expired=due!==undefined&&now>=due;
  const canSubmit=!expired&&((role==='A'&&job.status==='ACTIVE')||(role==='B'&&job.status==='A_SUBMITTED'));
  async function send(method:string,args:CalldataEncodable[]=[job.id],value=0n){
    if(!account||signing)return;setSigning(true);setError('');
    try{
      if(method==='submit_work'){
        const used=Object.values(job.artifacts).reduce((sum,item)=>sum+item.byte_length,0);
        validatePublicText(String(args[1]),Math.min(4096,(role==='A'?7168:8192)-used));
      }
      await submit(account,job.id,method,args,value);setText('');onSubmitted();
    }catch(e){setError(e instanceof Error?e.message:'Could not submit');}finally{setSigning(false);}
  }
  return <section className="actions"><div><span className="eyebrow">NEXT ACTION</span><h3>{account?(role?`Connected as ${role==='CLIENT'?'client':`worker ${role}`}`:'Read-only: this wallet is not a participant'):'Connect your wallet to participate'}</h3>{due&&<p className="meta">{expired?'Deadline reached':'Deadline'}: {new Date(due*1000).toLocaleString()}. The contract timestamp is authoritative.</p>}</div>{error&&<p role="alert" className="error">{error}</p>}<fieldset disabled={!account||busy||signing}>
    <Terms job={job}/>
    {job.status==='FUNDED'&&!expired&&(role==='A'||role==='B')&&!job.accepted[role]&&<><label className="check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>I accept this source, the task, fixed amounts, deadlines, neutral unwind and undisputed-timeout acceptance. B source checking is {job.terms.verify_source?'required':'not required'}.</label><code>Terms hash: {job.terms_hash}</code><button className="primary" disabled={!accepted||!job.obligations?.length} onClick={()=>void send('accept_job',[job.id,job.terms_hash],BigInt(job.terms.money[role].bond))}>Accept & deposit {money(job.terms.money[role].bond)}</button></>}
    {job.status==='FUNDED'&&role==='CLIENT'&&<button onClick={()=>void send('cancel_job')}>Cancel before activation</button>}
    {canSubmit&&<form onSubmit={e=>{e.preventDefault();const upstream=job.artifacts[role==='A'?'SOURCE':'A']!.submission_id;void send('submit_work',[job.id,text,upstream]);}}><label>Final {role==='A'?'extraction handoff':'report'}<textarea required value={text} onChange={e=>setText(e.target.value)} rows={6} placeholder="Paste the complete final text. This submission is immutable and public."/></label><p className="meta">{new TextEncoder().encode(text).length} / 4096 bytes. The contract also enforces the combined evidence limit.</p><button className="primary" disabled={!text.trim()||new TextEncoder().encode(text).length>4096}>Submit immutable work</button></form>}
    {job.status==='REVIEWABLE'&&role&&<div className="button-row">{!expired&&<button className="primary" onClick={()=>void send('request_review')}>Request GenLayer review</button>}{role==='CLIENT'&&<button onClick={()=>void send('approve_work')}>Accept work without AI review</button>}</div>}
    {job.status==='REVIEW_REQUESTED'&&!expired&&role&&<button className="primary" onClick={()=>void send('resolve_review')}>Run independent consensus review</button>}
    {expired&&due&&<button onClick={()=>void send('advance_timeout')}>Apply agreed deadline rule</button>}
    {['RESOLVED','CANCELLED'].includes(job.status)&&role&&BigInt(job.ledger.credits[role])>0n&&<><button onClick={()=>void send('claim')}>Request transfer of {money(job.ledger.credits[role])}</button><p className="meta">An emitted message is only a transfer request. Confirm the triggered child transaction reaches finality before treating it as payment.</p></>}
    {job.status==='INCONCLUSIVE'&&!expired&&<p className="meta">The review is inconclusive. Its verdict cannot be rerolled; neutral settlement becomes available at the deadline.</p>}
  </fieldset></section>;
}
export function amount(text:string):bigint {
  if(!/^\d+(?:\.\d{1,18})?$/.test(text))throw new Error('Use a non-negative GEN amount with at most 18 decimal places.');
  const result=parseUnits(text,18);if(result>100n*10n**18n)throw new Error('Each amount is limited to 100 test GEN.');return result;
}
export function NewJob({account,onClose,onSubmitted}:{account?:Address;onClose:()=>void;onSubmitted:(id:string)=>void}){
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[agree,setAgree]=useState(false);
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!account||busy)return;setBusy(true);setError('');
    try{
      const data=new FormData(event.currentTarget),value=(key:string)=>String(data.get(key)??'');
      validatePublicText(value('title'),120);validatePublicText(value('task'),768);validatePublicText(value('source'),4096);
      const a=value('workerA').trim(),b=value('workerB').trim();
      if(!/^0x[0-9a-fA-F]{40}$/.test(a)||!/^0x[0-9a-fA-F]{40}$/.test(b))throw new Error('Enter two valid worker wallet addresses.');
      if(new Set([a.toLowerCase(),b.toLowerCase(),account.toLowerCase()]).size!==3||[a,b].some(x=>/^0x0{40}$/.test(x)))throw new Error('The client and both workers must be three distinct nonzero wallets.');
      const id=`work-${crypto.randomUUID().slice(0,8)}`;
      const fa=amount(value('feeA')),fb=amount(value('feeB')),ba=amount(value('bondA')),bb=amount(value('bondB')),pa=amount(value('penaltyA')),pb=amount(value('penaltyB'));
      if([fa,fb,ba,bb].some(x=>x<=0n)||pa>ba||pb>bb)throw new Error('Fees and bonds must be positive; penalties cannot exceed their bonds.');
      const args:CalldataEncodable[]=[id,value('title'),value('task'),value('source'),new CalldataAddress(hexToBytes(a as Address)),new CalldataAddress(hexToBytes(b as Address)),fa,fb,ba,bb,pa,pb,86400n,86400n,86400n,86400n,data.has('verifySource')];
      await submit(account,id,'create_job',args,fa+fb);onSubmitted(id);
    }catch(e){setError(e instanceof Error?e.message:'Could not create job');}finally{setBusy(false);}
  }
  return <section className="new-job" aria-labelledby="new-job-title"><div className="section-heading"><div><span className="eyebrow">NEW WORK RECORD</span><h2 id="new-job-title">Agree before the first handoff.</h2></div><button onClick={onClose} disabled={busy}>Close</button></div><form onSubmit={e=>void create(e)}><fieldset disabled={busy}>
    <label>Title<input name="title" required maxLength={100} defaultValue="Export policy report"/></label>
    <label>Agreed task<textarea name="task" required rows={2} maxLength={600} defaultValue="Explain whether trial and paid accounts can export, and whether approval is needed."/></label>
    <label>Complete reference source<textarea name="source" required rows={4} defaultValue="Export requires approval. Trial accounts cannot export. Paid accounts may export after approval."/></label><p className="meta">Public UTF-8 text only, up to 4096 bytes. Do not submit confidential information.</p>
    <div className="form-grid"><label>Worker A wallet<input name="workerA" required placeholder="0x…"/></label><label>Worker B wallet<input name="workerB" required placeholder="0x…"/></label></div>
    <div className="form-grid">{(['A','B'] as const).map(role=><div className="money-fields" key={role}><h3>Worker {role}</h3>{['fee','bond','penalty'].map(key=><label key={key}>{label(key)} (GEN)<input name={key+role} inputMode="decimal" required defaultValue={key==='bond'?'0.002':'0.001'}/></label>)}</div>)}</div>
    <label className="check"><input type="checkbox" name="verifySource"/>Worker B must also verify the original source.</label><p>Each acceptance, work, review-request and adjudication window is one day. Both workers accept the exact terms before activation. If the client does not dispute submitted work in time, it is accepted. Unassessable work unwinds neutrally and may remain unpaid.</p>
    <label className="check"><input type="checkbox" required checked={agree} onChange={e=>setAgree(e.target.checked)}/>I understand that all evidence and test amounts are public, the reference is not independently verified truth, and this runs on Bradbury testnet.</label>
    {error&&<p role="alert" className="error">{error}</p>}<button className="primary" disabled={!account||!agree||busy}>{busy?'Check your wallet…':'Create job & deposit both fees'}</button>{!account&&<p className="meta">Connect your wallet first. No private key is requested by this website.</p>}
  </fieldset></form></section>;
}
