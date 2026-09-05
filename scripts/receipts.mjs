export function executionName(receipt) {
  const explicit = receipt.txExecutionResultName ?? receipt.tx_execution_result_name;
  if (explicit) return explicit;
  const entries = receipt.consensus_data?.leader_receipt;
  const all = Array.isArray(entries) ? entries : entries ? [entries] : [];
  // Studio's field may also include deterministic validators with an idle result.
  // Those are not a failed execution of the accepted leader's transaction.
  const leaders = all.filter(r => r.mode === 'leader');
  if (leaders.length !== 1) return 'UNKNOWN';
  // Studio supplies the exact execution_result on each accepted leader receipt.
  const names = leaders.map(r => r.execution_result);
  return names.every(n => n === 'SUCCESS' || n === 'FINISHED_WITH_RETURN') ? 'FINISHED_WITH_RETURN'
    : names.some(n => n === 'ERROR' || n === 'FINISHED_WITH_ERROR') ? 'FINISHED_WITH_ERROR' : 'UNKNOWN';
}

export function statusName(receipt) {
  return receipt.statusName ?? receipt.status_name ?? (typeof receipt.status === 'string' ? receipt.status : 'UNKNOWN');
}

export function assertExecution(receipt, finalized = true) {
  const status = statusName(receipt);
  if (!(finalized ? status === 'FINALIZED' : ['ACCEPTED','FINALIZED'].includes(status))) {
    throw new Error(`Lifecycle not ready: ${status}`);
  }
  const execution = executionName(receipt);
  if (execution !== 'FINISHED_WITH_RETURN') throw new Error(`Execution not proven successful: ${execution}`);
}
