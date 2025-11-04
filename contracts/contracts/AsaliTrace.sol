// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AsaliTrace {
    struct Batch {
        string batchId;
        string description;
        uint256 timestamp;
        address createdBy;
    }

    struct LabTest {
        string testId;
        string batchId;
        string result;
        uint256 timestamp;
    }

    struct Certificate {
        string certId;
        string batchId;
        string issuer;
        uint256 timestamp;
    }

    mapping(string => Batch) private batches;
    mapping(string => LabTest) private labTests;
    mapping(string => Certificate) private certificates;

    event BatchCreated(string batchId, string description, address indexed creator);
    event LabTestAdded(string testId, string batchId, string result);
    event CertificateIssued(string certId, string batchId, string issuer);

    function createBatch(string memory _batchId, string memory _description) public {
        require(batches[_batchId].timestamp == 0, "Batch already exists");
        batches[_batchId] = Batch({
            batchId: _batchId,
            description: _description,
            timestamp: block.timestamp,
            createdBy: msg.sender
        });
        emit BatchCreated(_batchId, _description, msg.sender);
    }

    function getBatch(string memory _batchId) public view returns (Batch memory) {
        require(batches[_batchId].timestamp != 0, "Batch not found");
        return batches[_batchId];
    }

    function addLabTest(string memory _testId, string memory _batchId, string memory _result) public {
        require(batches[_batchId].timestamp != 0, "Batch does not exist");
        require(labTests[_testId].timestamp == 0, "Test already exists");
        labTests[_testId] = LabTest({
            testId: _testId,
            batchId: _batchId,
            result: _result,
            timestamp: block.timestamp
        });
        emit LabTestAdded(_testId, _batchId, _result);
    }

    function getLabTest(string memory _testId) public view returns (LabTest memory) {
        require(labTests[_testId].timestamp != 0, "Lab test not found");
        return labTests[_testId];
    }

    function issueCertificate(string memory _certId, string memory _batchId, string memory _issuer) public {
        require(batches[_batchId].timestamp != 0, "Batch does not exist");
        require(certificates[_certId].timestamp == 0, "Certificate already exists");
        certificates[_certId] = Certificate({
            certId: _certId,
            batchId: _batchId,
            issuer: _issuer,
            timestamp: block.timestamp
        });
        emit CertificateIssued(_certId, _batchId, _issuer);
    }

    function getCertificate(string memory _certId) public view returns (Certificate memory) {
        require(certificates[_certId].timestamp != 0, "Certificate not found");
        return certificates[_certId];
    }
}