// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract XFlightRecorder {
    uint256 public reportCount;

    event ReportRecorded(
        bytes32 indexed reportId,
        bytes32 indexed reportHash,
        string projectUrl,
        uint8 score,
        address indexed verifier,
        uint256 timestamp
    );

    function recordReport(
        bytes32 reportId,
        bytes32 reportHash,
        string calldata projectUrl,
        uint8 score
    ) external {
        reportCount++;
        emit ReportRecorded(reportId, reportHash, projectUrl, score, msg.sender, block.timestamp);
    }
}
