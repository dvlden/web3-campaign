// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import "./Campaign.sol";

contract Factory {
    address[] public deployedCampaigns;

    function createCampaign (uint contribution) public {
        address campaign = address(new Campaign(contribution, msg.sender));
        deployedCampaigns.push(campaign);
    }

    function getDeployedCampaigns () public view returns(address[] memory) {
        return deployedCampaigns;
    }
}
