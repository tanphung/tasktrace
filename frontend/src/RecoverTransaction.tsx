import {useState} from 'react';
import {recoverHash,type TxRecord} from './transactions';
export function RecoverTransaction({record}:{record:TxRecord}){
  const [hash,setHash]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  return <form className="recover-transaction" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{await recoverHash(record,hash.trim());}catch(e){setError(e instanceof Error?e.message:'Cannot verify this receipt');}finally{setBusy(false);}}}><label>Recover the existing wallet transaction<input value={hash} onChange={e=>setHash(e.target.value)} placeholder="0x… transaction hash, never a private key" pattern="0x[0-9a-fA-F]{64}" required/></label><button disabled={busy}>Verify existing hash</button><span className="meta">Checks sender, contract, job and method. Does not send another transaction.</span>{error&&<p role="alert" className="error">{error}</p>}</form>;
}
