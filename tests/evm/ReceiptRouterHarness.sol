// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

interface ITaskTraceReceiptRouter {
    function release(bytes32 receiptId) external;
}

contract RejectingReceiptRecipient {
    function trigger(address router, bytes32 receiptId) external {
        ITaskTraceReceiptRouter(router).release(receiptId);
    }

    receive() external payable {
        revert("reject transfer");
    }
}

contract ReenteringReceiptRecipient {
    address private router;
    bytes32 private receiptId;
    bool public reentered;

    function trigger(address target, bytes32 id) external {
        router = target;
        receiptId = id;
        ITaskTraceReceiptRouter(target).release(id);
    }

    receive() external payable {
        (reentered,) = router.call(abi.encodeCall(ITaskTraceReceiptRouter.release, (receiptId)));
    }
}
