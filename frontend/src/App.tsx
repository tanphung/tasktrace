import {useEffect,useState} from 'react';
import {ArrowUpRight,Plus,RefreshCw,Route,FileText,ShieldCheck,ArrowRight,Layers3} from 'lucide-react';
import {chain,contract,explorer,short,listJobs,readJob,jobHref} from './client';
import type {Job,Artifact} from './types';

export function Evidence({artifact,label,index}:{artifact?:Artifact;label:string;index:string}) {
  return <article className="evidence-card"><div className="card-heading"><span className="step-square">{index}</span><div><h3>{label}</h3><span className="meta">{artifact ? `${artifact.byte_length} bytes · immutable revision 1` : 'Awaiting submission'}</span></div>{artifact && <ShieldCheck size={18} className="mint"/>}</div><div className="document">{artifact?.content ?? 'No document has been submitted for this step.'}</div>{artifact && <footer><span>SHA-256</span><code title={artifact.sha256}>{short(artifact.sha256)}</code></footer>}</article>;
}

export default function App() {
  const [ids,setIds]=useState<string[]>([]);
  const [job,setJob]=useState<Job>();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('job') ?? '');
  async function refresh() {
    setLoading(true);setError('');
    try {const found=await listJobs();setIds(found);const id=selected || found[0];if(id){setJob(await readJob(id));if(!selected)setSelected(id);}}
    catch(e){setError(e instanceof Error ? e.message:'Unable to read the network');}
    finally{setLoading(false);}
  }
  useEffect(()=>{void refresh();},[selected]);
  return <div className="app-shell"><aside className="sidebar"><a href="#" className="brand"><img src="/icon.svg" alt=""/><span>TaskTrace<span className="brand-dot">.</span></span></a><div className="sidebar-label">WORKSPACE</div><a className="nav-item active" href="#"><Layers3 size={18}/> Work handoffs <span>{ids.length}</span></a><div className="sidebar-label jobs-label">ON-CHAIN JOBS</div><nav aria-label="Jobs">{ids.map(id=><a className={`job-link ${id===selected?'selected':''}`} key={id} href={jobHref(id)} onClick={()=>setSelected(id)}><span className="tiny-dot"/>{id.replace(/-1-[a-f0-9]+$/,'').replaceAll('-',' ')}</a>)}</nav><div className="sidebar-bottom"><ShieldCheck size={19}/><p>Evidence first.<br/><strong>Responsibility follows.</strong></p><a href={`${explorer}/contracts/${contract}`} target="_blank" rel="noreferrer">View contract <ArrowUpRight size={14}/></a></div></aside>
    <main className="main"><header className="topbar"><span className="breadcrumb">Workspace <span>/</span> Work handoffs</span><span className="network"><span className="tiny-dot"/>{chain.name} · development</span></header><div className="content"><div className="page-heading"><div><span className="eyebrow">ACCOUNTABLE WORK, STEP BY STEP</span><h1>Every handoff tells a story.</h1><p>Follow the evidence. See where responsibility begins.</p></div><button className="primary" disabled title="New-job flow is being integrated"><Plus size={17}/> New job</button></div>
    <div className="notice"><Route size={17}/><span>Live StudioNet build. Reviews are being tested; recipient payments are not yet verified.</span></div>
    <section className="workspace"><div className="section-heading"><div><span className="eyebrow">WORK RECORD</span><h2>{job?.terms.title ?? 'Your work handoffs'}</h2></div><button className="icon-button" aria-label="Refresh on-chain data" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={17} className={loading?'spinning':''}/></button></div>{error && <div className="error" role="alert">{error}<button onClick={()=>void refresh()}>Retry</button></div>}{!job && !error && <p className="empty">{loading?'Reading the contract…':'No finalized jobs yet. New work records will appear here.'}</p>}{job && <><div className="job-summary"><span className="status">{job.status.replaceAll('_',' ')}</span><code>{job.id}</code><span className="meta">Client {short(job.client)}</span></div><div className="brief"><FileText size={18}/><div><span className="eyebrow">AGREED TASK</span><p>{job.terms.task}</p></div></div><div className="handoff-path"><span>01 <strong>Reference</strong></span><ArrowRight size={18}/><span>02 <strong>Extraction · A</strong></span><ArrowRight size={18}/><span>03 <strong>Report · B</strong></span></div><div className="evidence-grid"><Evidence index="01" label="Agreed reference" artifact={job.artifacts.SOURCE}/><Evidence index="A" label="Extraction handoff" artifact={job.artifacts.A}/><Evidence index="B" label="Final report" artifact={job.artifacts.B}/></div><div className="review-placeholder"><ShieldCheck size={22}/><div><h3>{job.review?'GenLayer review is available':'Review follows the evidence'}</h3><p>{job.review?'The on-chain review has been recorded. Detailed findings are being integrated into this view.':'A verdict is only shown after the contract records one. Submitted work is not automatically an AI-verified result.'}</p></div></div></>}</section><footer className="page-footer"><span>TaskTrace / Future of Work</span><span>Public evidence · fixed obligations · GenLayer consensus</span></footer></div></main></div>;
}
