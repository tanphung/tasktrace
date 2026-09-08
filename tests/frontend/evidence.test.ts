import {describe,it,expect} from 'vitest';
import {chunks,verifyArtifacts,verifyLedger} from '../../frontend/src/evidence';
import {jobFixture,reviewedFixture} from './fixtures';
describe('displayed evidence integrity',()=>{
  it('rejects incorrect credits instead of displaying invented settlement',async()=>{const job=await reviewedFixture();job.ledger.credits.A='16';expect(()=>verifyLedger(job)).toThrow('credit allocation');});
  it('rejects a claim sent to a different recipient',async()=>{const job=await reviewedFixture();job.settlement_reason='GENLAYER_REVIEW';job.claims.A={state:'MESSAGE_EMITTED',amount:'15',recipient:job.workers.B,settlement_id:job.id+':A:1',kind:job.settlement_reason,requested_at:150};expect(()=>verifyLedger(job)).toThrow('claim identity');});
  it('validates exact emitted amount without treating it as recipient payment',async()=>{const job=await reviewedFixture();job.settlement_reason='GENLAYER_REVIEW';job.claims.A={state:'MESSAGE_EMITTED',amount:'15',recipient:job.workers.A,settlement_id:job.id+':A:1',kind:job.settlement_reason,requested_at:150};job.ledger.credits.A='0';job.ledger.emitted='15';expect(()=>verifyLedger(job)).not.toThrow();});
  it('rejects changed payment terms even with untouched artifacts',async()=>{const job=await jobFixture();job.terms.money.A.penalty='4';await expect(verifyArtifacts(job)).rejects.toThrow('accepted terms hash');});
  it('rejects changed acceptance deadline',async()=>{const job=await jobFixture();job.accept_deadline++;await expect(verifyArtifacts(job)).rejects.toThrow('accepted terms hash');});
  it('checks complete artifact hashes and exact review citations',async()=>{await expect(verifyArtifacts(await reviewedFixture())).resolves.toBeUndefined();});
  it.each(['content','issuer','upstream','sha256','submission_id','byte_length'] as const)('rejects mutated %s',async field=>{
    const job=await jobFixture();(job.artifacts.A as unknown as Record<string,unknown>)[field]=field==='byte_length'?1:'tampered';await expect(verifyArtifacts(job)).rejects.toThrow('Evidence integrity');
  });
  it.each(['start_byte','end_byte','chunk_sha256','quote'] as const)('rejects mutated citation %s',async field=>{
    const job=await reviewedFixture();(job.review!.result.assessments[0].citations[0] as unknown as Record<string,unknown>)[field]=field.includes('byte')?99:'invented';await expect(verifyArtifacts(job)).rejects.toThrow('Evidence integrity');
  });
  it('rejects one-sided determinate citations',async()=>{const job=await reviewedFixture();job.review!.result.assessments[0].citations.pop();await expect(verifyArtifacts(job)).rejects.toThrow('missing source/deliverable');});
  it('does not skip the final UTF-8 chunk',async()=>{const job=await jobFixture();const artifact={...job.artifacts.SOURCE!,content:'Việt Nam 😀 '.repeat(200)+'FINAL EXCEPTION'};const result=chunks(artifact);expect(result.length).toBeGreaterThan(1);expect(result.map(c=>c.content).join('')).toBe(artifact.content);expect(result.at(-1)!.content).toContain('FINAL EXCEPTION');});
  it('rejects missing, duplicate and reordered obligation IDs',async()=>{for(const mutation of ['missing','duplicate','reorder']){const job=await reviewedFixture();const a=job.review!.result.assessments;if(mutation==='missing')a.pop();else if(mutation==='duplicate')a[1]=a[0];else a.reverse();await expect(verifyArtifacts(job)).rejects.toThrow('obligation sequence');}});
});
