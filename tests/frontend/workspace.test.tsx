import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {Actions,NewJob,amount,roleOf} from '../../frontend/src/Actions';
import {Findings,Payments,money} from '../../frontend/src/Findings';
import {jobFixture,reviewedFixture} from './fixtures';
describe('honest contract rendering',()=>{
  it('never fabricates an AI verdict for a review request',async()=>{const job=await jobFixture();job.status='REVIEW_REQUESTED';render(<Findings job={job}/>);expect(screen.getByText('No consensus review recorded')).toBeInTheDocument();expect(screen.queryByText('Responsibility, with receipts.')).not.toBeInTheDocument();});
  it('distinguishes client acceptance from AI review',async()=>{const job=await jobFixture();job.settlement_reason='CLIENT_ACCEPTED';render(<Findings job={job}/>);expect(screen.getByText(/not an AI-reviewed verdict/)).toBeInTheDocument();});
  it('renders findings with exact citation text',async()=>{render(<Findings job={await reviewedFixture()}/>);expect(screen.getByText('Responsibility, with receipts.')).toBeInTheDocument();expect(screen.getAllByText('A meaning')).toHaveLength(1);});
  it('never treats an emitted message as paid',async()=>{const job=await reviewedFixture();job.claims.A={state:'MESSAGE_EMITTED',amount:'15',recipient:job.workers.A,kind:'GENLAYER_REVIEW',requested_at:150,settlement_id:'test-job:A:1'};render(<Payments job={job}/>);expect(screen.getByText('Recipient payment not verified')).toBeInTheDocument();expect(screen.queryByText('Payment completed')).not.toBeInTheDocument();});
  it('keeps the new-job submit disabled without wallet even after consent',()=>{render(<NewJob onClose={()=>{}} onSubmitted={()=>{}}/>);fireEvent.click(screen.getByRole('checkbox',{name:/all evidence is public/}));expect(screen.getByRole('button',{name:/Create job/})).toBeDisabled();});
  it('unrelated wallet cannot review the job',async()=>{const job=await jobFixture();render(<Actions job={job} account="0x5555555555555555555555555555555555555555" busy={false} onSubmitted={vi.fn()}/>);expect(screen.queryByRole('button',{name:/Request GenLayer review/})).not.toBeInTheDocument();});
  it('matches participant addresses case-insensitively',async()=>{const job=await jobFixture();expect(roleOf(job,job.workers.A.toUpperCase())).toBe('A');});
  it.each(['-1','1e3','1.0000000000000000001','101','NaN'])('rejects unsafe GEN input %s',input=>expect(()=>amount(input)).toThrow());
  it('keeps integer arithmetic for tiny amounts',()=>{expect(amount('0.000000000000000001')).toBe(1n);expect(money('27')).toBe('27 attoGEN');});
});
