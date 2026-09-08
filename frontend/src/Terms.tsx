import type {Job} from './types';
import {label} from './Findings';

export function Terms({job}:{job:Job}){
  return <details className="finding" open={job.status==='FUNDED'}><summary>Accepted duties and deadlines · {job.terms.version}</summary>
    {!job.obligations?<p role="alert">Contract duties are not loaded. Do not accept this job yet.</p>:job.obligations.map(item=><div key={item.id}><h3>{label(item.id)}</h3><p>{item.rule}</p></div>)}
    <p>Acceptance: {job.terms.accept_seconds} seconds. Each work step: {job.terms.step_seconds} seconds. Review request: {job.terms.review_seconds} seconds. Adjudication: {job.terms.adjudication_seconds} seconds.</p>
    <p>These are separate windows, starting at their corresponding on-chain transitions. Missed work can forfeit fees and the agreed penalty. Undisputed work is accepted after its review window. An unavailable or unassessable review can return fees and bonds without paying for work.</p>
    <code>Verified terms hash: {job.terms_hash}</code>
  </details>;
}
