// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

contract Campaign {
    struct Request {
        string description;
        uint value;
        address payable recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }

    address public manager;
    uint private totalRequests;
    uint public minimumContribution;
    uint public approversCount;

    mapping(uint => Request) public requests;
    mapping(address => bool) public approvers;

    modifier onlyManager {
        require(msg.sender == manager, "Only a manager can access this.");
        _;
    }

    constructor (uint contribution, address creator) {
        manager = creator;
        minimumContribution = contribution;
    }

    function contribute () public payable {
        require(msg.value >= minimumContribution, "Minimum contribution does not meet criteria.");
        approvers[msg.sender] = true;
        approversCount++;
    }

    function approveRequest (uint index) public {
        Request storage request = requests[index];

        require(approvers[msg.sender], "You did not contribute to become approver.");
        require(!request.approvals[msg.sender], "You already voted for this request");

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    // Manager functions
    function createRequest (string calldata description, uint value, address payable recipient) public onlyManager {
        Request storage request = requests[totalRequests++];

        request.description = description;
        request.value = value;
        request.recipient = recipient;
        request.complete = false;
        request.approvalCount = 0;
    }

    function finalizeRequest (uint index) public onlyManager {
        Request storage request = requests[index];

        require(request.approvalCount >= (approversCount / 2), "This request is not approved.");
        require(!request.complete, "This request was already finalized.");

        request.recipient.transfer(request.value);
        request.complete = true;
    }
}
