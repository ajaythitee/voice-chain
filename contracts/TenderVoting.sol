// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TenderVoting
 * @dev Gasless voting with meta-transactions, scheduled start/end times
 */
contract TenderVoting is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    struct Tender {
        uint256 id;
        address organization;
        string title;
        string description;
        string category;
        string[] options;
        uint256 startTime;
        uint256 deadline;
        bool isRestricted;
        bool hideResults;
        bool isClosed;
        uint256 createdAt;
    }
    
    struct Comment {
        address voter;
        string message;
        uint256 optionIndex;
        uint256 timestamp;
    }
    
    uint256 public tenderCount;
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => mapping(uint256 => uint256)) public optionVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public whitelist;
    mapping(address => uint256[]) public organizationTenders;
    mapping(address => uint256[]) public voterHistory;
    mapping(uint256 => Comment[]) public tenderComments;
    mapping(address => uint256) public nonces;
    
    address public relayer;
    
    event TenderCreated(uint256 indexed tenderId, address indexed organization, string title, uint256 startTime, uint256 deadline);
    event VoteCast(uint256 indexed tenderId, address indexed voter, uint256 optionIndex, string comment);
    event TenderClosed(uint256 indexed tenderId);
    event WhitelistUpdated(uint256 indexed tenderId, address indexed voter, bool status);
    event RelayerUpdated(address indexed newRelayer);
    
    constructor() {
        relayer = msg.sender;
    }
    
    function setRelayer(address _relayer) external {
        require(msg.sender == relayer, "Only relayer");
        relayer = _relayer;
        emit RelayerUpdated(_relayer);
    }
    
    /**
     * @dev Create a new campaign with start/end times
     * @param _startTime When voting begins (0 = start immediately)
     * @param _deadline When voting ends
     */
    function createTender(
        string memory _title,
        string memory _description,
        string memory _category,
        string[] memory _options,
        uint256 _startTime,
        uint256 _deadline,
        bool _isRestricted,
        bool _hideResults,
        address[] memory _whitelist
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_options.length >= 2, "Need at least 2 options");
        require(_deadline > block.timestamp, "Deadline must be in future");
        
        uint256 startTime = _startTime == 0 ? block.timestamp : _startTime;
        require(startTime >= block.timestamp, "Start time cannot be in past");
        require(_deadline > startTime, "Deadline must be after start");
        
        tenders[tenderCount] = Tender({
            id: tenderCount,
            organization: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            options: _options,
            startTime: startTime,
            deadline: _deadline,
            isRestricted: _isRestricted,
            hideResults: _hideResults,
            isClosed: false,
            createdAt: block.timestamp
        });
        
        if (_isRestricted) {
            require(_whitelist.length > 0, "Whitelist cannot be empty");
            for (uint i = 0; i < _whitelist.length; i++) {
                require(_whitelist[i] != address(0), "Invalid address");
                whitelist[tenderCount][_whitelist[i]] = true;
                emit WhitelistUpdated(tenderCount, _whitelist[i], true);
            }
        }
        
        organizationTenders[msg.sender].push(tenderCount);
        emit TenderCreated(tenderCount, msg.sender, _title, startTime, _deadline);
        
        uint256 currentId = tenderCount;
        tenderCount++;
        return currentId;
    }
    
    function vote(uint256 _tenderId, uint256 _optionIndex, string memory _comment) public nonReentrant {
        _castVote(_tenderId, msg.sender, _optionIndex, _comment);
    }
    
    function voteWithSignature(
        uint256 _tenderId,
        uint256 _optionIndex,
        string memory _comment,
        address _voter,
        uint256 _nonce,
        bytes memory _signature
    ) public nonReentrant {
        require(msg.sender == relayer, "Only relayer");
        require(_nonce == nonces[_voter], "Invalid nonce");
        
        bytes32 messageHash = keccak256(abi.encodePacked(_tenderId, _optionIndex, _comment, _voter, _nonce, address(this)));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(_signature);
        require(signer == _voter, "Invalid signature");
        
        nonces[_voter]++;
        _castVote(_tenderId, _voter, _optionIndex, _comment);
    }
    
    function _castVote(uint256 _tenderId, address _voter, uint256 _optionIndex, string memory _comment) internal {
        require(_tenderId < tenderCount, "Tender does not exist");
        Tender storage tender = tenders[_tenderId];
        
        require(!tender.isClosed, "Campaign is closed");
        require(block.timestamp >= tender.startTime, "Voting not started yet");
        require(block.timestamp < tender.deadline, "Voting ended");
        require(!hasVoted[_tenderId][_voter], "Already voted");
        require(_optionIndex < tender.options.length, "Invalid option");
        
        if (tender.isRestricted) {
            require(whitelist[_tenderId][_voter], "Not whitelisted");
        }
        
        hasVoted[_tenderId][_voter] = true;
        voterHistory[_voter].push(_tenderId);
        optionVotes[_tenderId][_optionIndex]++;
        
        if (bytes(_comment).length > 0) {
            tenderComments[_tenderId].push(Comment({
                voter: _voter,
                message: _comment,
                optionIndex: _optionIndex,
                timestamp: block.timestamp
            }));
        }
        
        emit VoteCast(_tenderId, _voter, _optionIndex, _comment);
    }
    
    function getOptions(uint256 _tenderId) public view returns (string[] memory) {
        require(_tenderId < tenderCount, "Invalid tender");
        return tenders[_tenderId].options;
    }
    
    function getOptionVotes(uint256 _tenderId) public view returns (uint256[] memory) {
        require(_tenderId < tenderCount, "Invalid tender");
        Tender storage tender = tenders[_tenderId];
        uint256 optionCount = tender.options.length;
        uint256[] memory votes = new uint256[](optionCount);
        
        // If hideResults is enabled and voting not ended, return zeros
        if (tender.hideResults && block.timestamp < tender.deadline && !tender.isClosed) {
            return votes;
        }
        
        for (uint i = 0; i < optionCount; i++) {
            votes[i] = optionVotes[_tenderId][i];
        }
        return votes;
    }
    
    /**
     * @dev Get votes - creator always sees results regardless of hideResults
     * @param _caller Address to check if they are the creator
     */
    function getOptionVotesForCreator(uint256 _tenderId, address _caller) public view returns (uint256[] memory) {
        require(_tenderId < tenderCount, "Invalid tender");
        Tender storage tender = tenders[_tenderId];
        uint256 optionCount = tender.options.length;
        uint256[] memory votes = new uint256[](optionCount);
        
        // Creator always sees results
        bool isCreator = _caller == tender.organization;
        bool votingEnded = block.timestamp >= tender.deadline || tender.isClosed;
        
        // Show results to creator OR if hideResults is off OR if voting ended
        if (!isCreator && tender.hideResults && !votingEnded) {
            return votes; // Return zeros
        }
        
        for (uint i = 0; i < optionCount; i++) {
            votes[i] = optionVotes[_tenderId][i];
        }
        return votes;
    }
    
    function getComments(uint256 _tenderId) public view returns (
        address[] memory voters,
        string[] memory messages,
        uint256[] memory optionIndexes,
        uint256[] memory timestamps
    ) {
        require(_tenderId < tenderCount, "Invalid tender");
        Comment[] storage comments = tenderComments[_tenderId];
        uint256 len = comments.length;
        
        voters = new address[](len);
        messages = new string[](len);
        optionIndexes = new uint256[](len);
        timestamps = new uint256[](len);
        
        for (uint i = 0; i < len; i++) {
            voters[i] = comments[i].voter;
            messages[i] = comments[i].message;
            optionIndexes[i] = comments[i].optionIndex;
            timestamps[i] = comments[i].timestamp;
        }
    }
    
    function closeTender(uint256 _tenderId) public {
        require(_tenderId < tenderCount, "Invalid tender");
        Tender storage tender = tenders[_tenderId];
        require(block.timestamp >= tender.deadline, "Not ended");
        require(!tender.isClosed, "Already closed");
        tender.isClosed = true;
        emit TenderClosed(_tenderId);
    }
    
    function canVote(uint256 _tenderId, address _voter) public view returns (bool) {
        if (_tenderId >= tenderCount) return false;
        Tender storage tender = tenders[_tenderId];
        if (tender.isClosed) return false;
        if (block.timestamp < tender.startTime) return false;
        if (block.timestamp >= tender.deadline) return false;
        if (hasVoted[_tenderId][_voter]) return false;
        if (tender.isRestricted && !whitelist[_tenderId][_voter]) return false;
        return true;
    }
    
    function getTenderDetails(uint256 _tenderId) public view returns (
        uint256 id,
        address organization,
        string memory title,
        string memory description,
        string memory category,
        uint256 startTime,
        uint256 deadline,
        bool isRestricted,
        bool hideResults,
        uint256 optionCount,
        bool isClosed,
        uint256 createdAt
    ) {
        require(_tenderId < tenderCount, "Invalid tender");
        Tender storage tender = tenders[_tenderId];
        return (
            tender.id,
            tender.organization,
            tender.title,
            tender.description,
            tender.category,
            tender.startTime,
            tender.deadline,
            tender.isRestricted,
            tender.hideResults,
            tender.options.length,
            tender.isClosed,
            tender.createdAt
        );
    }
    
    function getActiveTenders() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < tenderCount; i++) {
            if (!tenders[i].isClosed && block.timestamp < tenders[i].deadline) {
                activeCount++;
            }
        }
        
        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < tenderCount; i++) {
            if (!tenders[i].isClosed && block.timestamp < tenders[i].deadline) {
                activeIds[idx] = i;
                idx++;
            }
        }
        return activeIds;
    }
    
    function getOrganizationTenders(address _org) public view returns (uint256[] memory) {
        return organizationTenders[_org];
    }
    
    function getVoterHistory(address _voter) public view returns (uint256[] memory) {
        return voterHistory[_voter];
    }
    
    function getNonce(address _voter) public view returns (uint256) {
        return nonces[_voter];
    }
    
    function isWhitelisted(uint256 _tenderId, address _voter) public view returns (bool) {
        return whitelist[_tenderId][_voter];
    }
}
