import verification from './payment-verification.json';
import type {Job,Role} from './types';

export function verifiedPayment(job:Job,role:Role){
  if(role!==verification.role||job.id!==verification.jobId)return;
  const claim=job.claims[role];
  if(!claim||claim.state!=='MESSAGE_EMITTED'||claim.settlement_id!==verification.settlementId)return;
  if(claim.recipient.toLowerCase()!==verification.recipient.toLowerCase()||claim.amount!==verification.amount)return;
  const before=BigInt(verification.recipientBalanceBefore),after=BigInt(verification.recipientBalanceAfter),delta=BigInt(verification.recipientBalanceDelta);
  if(after-before!==delta||delta!==BigInt(claim.amount))return;
  return verification;
}
