// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAccessControl {
    function hasAccess(address user) external view returns (bool);
}

contract FreelanceProjectContract {
    struct Project {
        uint id;
        address client;
        string title;
        string description;
        uint budget;
        address selectedFreelancer;
        uint bidAmount;
        bool isCompleted;
        bool isPaid;
        string githubRepo;
        uint createdAt;
    }

    struct Proposal {
        uint projectId;
        address freelancer;
        string details;
        uint bidAmount;
    }

    uint public projectCount;
    mapping(uint => Project) public projects;
    mapping(uint => Proposal[]) public proposals;

    IAccessControl public accessControl;

    modifier onlyAuthorized() {
        require(accessControl.hasAccess(msg.sender), "Access denied");
        _;
    }

    modifier onlyClient(uint projectId) {
        require(msg.sender == projects[projectId].client, "Not project client");
        _;
    }

    modifier onlyFreelancer(uint projectId) {
        require(msg.sender == projects[projectId].selectedFreelancer, "Not assigned freelancer");
        _;
    }

    constructor(address accessControlAddress) {
        accessControl = IAccessControl(accessControlAddress);
    }

    function registerProject(
        string memory title,
        string memory description,
        uint budget,
        string memory githubRepo
    ) external onlyAuthorized {
        projectCount++;
        projects[projectCount] = Project(
            projectCount,
            msg.sender,
            title,
            description,
            budget,
            address(0),
            0,
            false,
            false,
            githubRepo,
            block.timestamp
        );
    }

    function submitProposal(uint projectId, string memory details, uint bidAmount) external onlyAuthorized {
        require(projects[projectId].id != 0, "Project does not exist");
        proposals[projectId].push(Proposal(projectId, msg.sender, details, bidAmount));
    }

    function assignProject(uint projectId, address freelancer, uint bidAmount) external payable onlyClient(projectId) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(msg.value == bidAmount, "Incorrect payment amount");
        
        projects[projectId].selectedFreelancer = freelancer;
        projects[projectId].bidAmount = bidAmount;
    }

    function markComplete(uint projectId) external onlyFreelancer(projectId) {
        require(projects[projectId].id != 0, "Project does not exist");
        projects[projectId].isCompleted = true;
    }

    function approveCompletion(uint projectId) external onlyClient(projectId) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].isCompleted, "Project not marked complete");
        projects[projectId].isPaid = true;
    }

    function releaseFunds(uint projectId) external onlyClient(projectId) {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].isPaid, "Project not approved");

        address freelancer = projects[projectId].selectedFreelancer;
        uint amount = projects[projectId].bidAmount;
        
        projects[projectId].bidAmount = 0;
        payable(freelancer).transfer(amount);
    }

    function dispute(uint projectId) external view {
        require(projects[projectId].id != 0, "Project does not exist");
        require(msg.sender == projects[projectId].client || msg.sender == projects[projectId].selectedFreelancer, "Not authorized");
        // Implement dispute resolution logic here
    }

    function getProject(uint projectId) external view returns (Project memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return projects[projectId];
    }

    function getProposals(uint projectId) external view returns (Proposal[] memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return proposals[projectId];
    }

    receive() external payable {} // Allows contract to receive payments
}
