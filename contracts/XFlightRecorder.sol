// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract XFlightRecorder {
    address public owner;
    uint256 public reportCount;
    uint256 public planCount;
    uint256 public executionCount;

    mapping(address => bool) public authorizedAttesters;
    mapping(bytes32 => bool) public planExists;
    mapping(bytes32 => bool) public reportExists;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AttesterAuthorizationUpdated(address indexed attester, bool allowed);
    event PlanCommitted(
        bytes32 indexed actionId,
        address indexed agent,
        bytes32 planHash,
        string metadataURI,
        uint256 timestamp
    );
    event ExecutionRecorded(
        bytes32 indexed actionId,
        bytes32 indexed txHash,
        bytes32 observedHash,
        uint256 timestamp
    );
    event ReportAttested(
        bytes32 indexed reportId,
        address indexed verifier,
        bytes32 reportHash,
        uint8 verdict,
        uint16 flightScore,
        string reportURI,
        uint256 timestamp
    );

    error NotOwner();
    error NotAuthorizedAttester();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAttester() {
        if (!authorizedAttesters[msg.sender]) revert NotAuthorizedAttester();
        _;
    }

    constructor(address initialAttester) {
        if (initialAttester == address(0)) revert ZeroAddress();
        owner = msg.sender;
        authorizedAttesters[initialAttester] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit AttesterAuthorizationUpdated(initialAttester, true);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setAuthorizedAttester(address attester, bool allowed) external onlyOwner {
        if (attester == address(0)) revert ZeroAddress();
        authorizedAttesters[attester] = allowed;
        emit AttesterAuthorizationUpdated(attester, allowed);
    }

    function commitPlan(
        bytes32 actionId,
        bytes32 planHash,
        string calldata metadataURI
    ) external onlyAttester {
        require(!planExists[actionId], "Plan already committed");
        planExists[actionId] = true;
        planCount++;
        emit PlanCommitted(actionId, msg.sender, planHash, metadataURI, block.timestamp);
    }

    function recordExecution(
        bytes32 actionId,
        bytes32 txHash,
        bytes32 observedHash
    ) external onlyAttester {
        executionCount++;
        emit ExecutionRecorded(actionId, txHash, observedHash, block.timestamp);
    }

    function attestReport(
        bytes32 reportId,
        bytes32 reportHash,
        uint8 verdict,
        uint16 flightScore,
        string calldata reportURI
    ) external onlyAttester {
        require(!reportExists[reportId], "Report already attested");
        reportExists[reportId] = true;
        reportCount++;
        emit ReportAttested(reportId, msg.sender, reportHash, verdict, flightScore, reportURI, block.timestamp);
    }
}
