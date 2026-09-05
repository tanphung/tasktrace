import {createClient} from 'genlayer-js';
import {studionet,testnetBradbury} from 'genlayer-js/chains';
import {TransactionHashVariant, type Address} from 'genlayer-js/types';
import deployment from './deployment.json';
import type {Job} from './types';

export const chain = deployment.network === 'testnet-bradbury' ? testnetBradbury : studionet;
export const contract = deployment.contract as Address;
export const readClient = createClient({chain});
export const explorer = chain.blockExplorers?.default.url ?? '';
export const short = (value:string)=>`${value.slice(0,6)}…${value.slice(-4)}`;
export const jobHref = (id:string)=>`#job=${encodeURIComponent(id)}`;
export async function readJob(id:string):Promise<Job> {
  const value = await readClient.readContract({address:contract,functionName:'get_job',args:[id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
  if (typeof value !== 'string') throw new Error('Unexpected contract response');
  const job = JSON.parse(value) as Job;
  if (job.id !== id || Number(job.chain_id) !== chain.id || job.contract.toLowerCase() !== contract.toLowerCase()) throw new Error('Contract evidence domain mismatch');
  return job;
}
export async function listJobs():Promise<string[]> {
  const raw = await readClient.readContract({address:contract,functionName:'list_jobs',args:[0n,50n],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
  if (typeof raw !== 'string') throw new Error('Unexpected job list');
  return (JSON.parse(raw) as {ids:string[]}).ids;
}
