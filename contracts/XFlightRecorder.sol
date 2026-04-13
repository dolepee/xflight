// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract XFlightRecorder {
    uint256 public reportCount;
    uint256 public planCount;
    uint256 public executionCount;

    mapping(bytes32 => bool) public planExists;
    mapping(bytes32 => bool) public reportExists;

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

    function commitPlan(
        bytes32 actionId,
        bytes32 planHash,
        string calldata metadataURI
    ) external {
        require(!planExists[actionId], "Plan already committed");
        planExists[actionId] = true;
        planCount++;
        emit PlanCommitted(actionId, msg.sender, planHash, metadataURI, block.timestamp);
    }

    function recordExecution(
        bytes32 actionId,
        bytes32 txHash,
        bytes32 observedHash
    ) external {
        executionCount++;
        emit ExecutionRecorded(actionId, txHash, observedHash, block.timestamp);
    }

    function attestReport(
        bytes32 reportId,
        bytes32 reportHash,
        uint8 verdict,
        uint16 flightScore,
        string calldata reportURI
    ) external {
        require(!reportExists[reportId], "Report already attested");
        reportExists[reportId] = true;
        reportCount++;
        emit ReportAttested(reportId, msg.sender, reportHash, verdict, flightScore, reportURI, block.timestamp);
    }
}
