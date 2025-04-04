// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract AccessControlContract {
    mapping(address => bool) private authorizedUsers;
    mapping(address => bool) private isRegistered; // Track registered users
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    function grantAccess(address user) external onlyOwner {
        authorizedUsers[user] = true;
        isRegistered[user] = true;
    }

    function revokeAccess(address user) external onlyOwner {
        authorizedUsers[user] = false;
    }

    function hasAccess(address user) external view returns (bool) {
        require(isRegistered[user], "User not registered");
        return authorizedUsers[user];
    }
}
