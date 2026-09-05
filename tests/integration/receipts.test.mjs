import test from 'node:test';
import assert from 'node:assert/strict';
import {executionName,assertExecution} from '../../scripts/receipts.mjs';

test('Studio idle validator does not override successful leader execution',()=>{
  const receipt={statusName:'FINALIZED',consensus_data:{leader_receipt:[{mode:'leader',execution_result:'SUCCESS'},{mode:'validator',execution_result:'ERROR',result:{status:'contract_error',payload:'idle'}}]}};
  assert.equal(executionName(receipt),'FINISHED_WITH_RETURN');
  assertExecution(receipt);
});
test('accepted is provisional and finalized errors are still errors',()=>{
  assert.throws(()=>assertExecution({statusName:'ACCEPTED',txExecutionResultName:'FINISHED_WITH_RETURN'}));
  assert.throws(()=>assertExecution({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_ERROR'}));
  assert.throws(()=>assertExecution({statusName:'FINALIZED'}));
});
