export type Role = 'CLIENT'|'A'|'B';
export type Outcome = 'SATISFIED'|'VIOLATED'|'UNASSESSABLE';
export interface Artifact {
  role:'SOURCE'|'A'|'B'; content:string; byte_length:number; sha256:string;
  submission_id:string; issuer:string; upstream:string; revision:number;
  chain_id:string; contract:string; job_id:string;
  content_type:string;encoding:string;
}
export interface Citation {chunk_id:string;quote:string;start_byte:number;end_byte:number;chunk_sha256:string}
export interface Assessment {obligation_id:string;status:Outcome;reason:string;citations:Citation[]}
export interface Obligation {id:string;stage:'A'|'B';rule:string;evidence_roles:string[]}
export interface Job {
  id:string;client:string;workers:{A:string;B:string};status:string;terms_hash:string;
  chain_id:string;contract:string;accepted:{A:boolean;B:boolean};b_missing:boolean;
  terms:{version:string;title:string;task:string;verify_source:boolean;money:Record<'A'|'B',{fee:string;bond:string;penalty:string}>;accept_seconds:number;step_seconds:number;review_seconds:number;adjudication_seconds:number};
  obligations?:Obligation[];
  artifacts:Partial<Record<'SOURCE'|'A'|'B',Artifact>>;
  created_at:number;accept_deadline:number;a_deadline?:number;b_deadline?:number;review_deadline?:number;adjudication_deadline?:number;
  outcomes?:{A:Outcome;B:Outcome};settlement_reason?:string;resolved_at?:number;
  review?:{snapshot_sha256:string;terms_hash:string;reviewed_at:number;result:{reviewed_chunks:string[];assessments:Assessment[]}};
  ledger:{received:string;issued:string;emitted:string;credits:Record<Role,string>};
  claims:Partial<Record<Role,{settlement_id:string;recipient:string;amount:string;state:string;kind:string;requested_at:number}>>;
}
