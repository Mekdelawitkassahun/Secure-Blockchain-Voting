// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UniVote {
    // ============ DATA STRUCTURES ============
    
    struct Candidate {
        uint256 id;
        string name;
        string slogan;
        string manifesto;
        string promises;
        string color;
        uint256 voteCount;
    }
    
    struct VoteCommitment {
        bytes32 commitHash;
        bool revealed;
    }
    
    // ============ STATE VARIABLES ============
    
    enum Phase { REGISTRATION, VOTING, REVEAL, ENDED }
    Phase public currentPhase;
    
    address public admin;
    
    uint256 public registrationEndTime;
    uint256 public votingEndTime;
    uint256 public revealEndTime;
    
    mapping(address => bool) public isRegistered;
    address[] public registeredVoters;
    uint256 public totalRegistered;
    
    mapping(address => bytes32) public commitHash;  // Simpler storage
    mapping(address => bool) public hasRevealed;
    
    Candidate[] public candidates;
    
    // ============ EVENTS ============
    
    event VoterRegistered(address indexed voter);
    event VoteCommitted(address indexed voter, bytes32 commitHash);
    event VoteRevealed(address indexed voter, uint256 candidateId);
    event PhaseAdvanced(uint256 newPhase);
    event ElectionReset();
    
    // ============ MODIFIERS ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    modifier inPhase(Phase _phase) {
        require(currentPhase == _phase, "Wrong phase");
        _;
    }
    
    modifier notEnded() {
        require(currentPhase != Phase.ENDED, "Election ended");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string[] memory _names,
        string[] memory _slogans,
        string[] memory _manifestos,
        string[] memory _promises,
        string[] memory _colors,
        uint256 _registrationMinutes,
        uint256 _votingMinutes,
        uint256 _revealMinutes
    ) {
        require(_names.length == 6, "Need 6 candidates");
        
        admin = msg.sender;
        
        registrationEndTime = block.timestamp + (_registrationMinutes * 60);
        votingEndTime = registrationEndTime + (_votingMinutes * 60);
        revealEndTime = votingEndTime + (_revealMinutes * 60);
        
        currentPhase = Phase.REGISTRATION;
        
        for (uint256 i = 0; i < _names.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: _names[i],
                slogan: _slogans[i],
                manifesto: _manifestos[i],
                promises: _promises[i],
                color: _colors[i],
                voteCount: 0
            }));
        }
    }
    
    // ============ REGISTRATION ============
    
    function register() external notEnded inPhase(Phase.REGISTRATION) {
        require(!isRegistered[msg.sender], "Already registered");
        require(block.timestamp < registrationEndTime, "Registration ended");
        
        isRegistered[msg.sender] = true;
        registeredVoters.push(msg.sender);
        totalRegistered++;
        
        emit VoterRegistered(msg.sender);
    }
    
    // ============ VOTING ============
    
    function commitVote(bytes32 _commitHash) external notEnded inPhase(Phase.VOTING) {
        require(isRegistered[msg.sender], "Not registered");
        require(commitHash[msg.sender] == 0, "Already committed");
        require(block.timestamp < votingEndTime, "Voting ended");
        require(_commitHash != 0, "Invalid hash");
        
        commitHash[msg.sender] = _commitHash;
        
        emit VoteCommitted(msg.sender, _commitHash);
    }
    
    // ============ REVEAL ============
    
    function revealVote(uint256 _candidateId, string memory _secret) external notEnded inPhase(Phase.REVEAL) {
        require(isRegistered[msg.sender], "Not registered");
        require(!hasRevealed[msg.sender], "Already revealed");
        require(commitHash[msg.sender] != 0, "No vote found");
        require(block.timestamp < revealEndTime, "Reveal ended");
        require(_candidateId < candidates.length, "Invalid candidate");
        
        bytes32 expectedHash = keccak256(abi.encodePacked(_candidateId, _secret));
        require(commitHash[msg.sender] == expectedHash, "Invalid secret");
        
        hasRevealed[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        
        emit VoteRevealed(msg.sender, _candidateId);
    }
    
    // ============ ADMIN ============
    
    function advancePhase() external onlyAdmin {
        if (currentPhase == Phase.REGISTRATION) {
            require(block.timestamp >= registrationEndTime, "Time not ended");
            require(totalRegistered > 0, "Need at least 1 voter");
            currentPhase = Phase.VOTING;
        }
        else if (currentPhase == Phase.VOTING) {
            require(block.timestamp >= votingEndTime, "Time not ended");
            currentPhase = Phase.REVEAL;
        }
        else if (currentPhase == Phase.REVEAL) {
            require(block.timestamp >= revealEndTime, "Time not ended");
            currentPhase = Phase.ENDED;
        }
        
        emit PhaseAdvanced(uint256(currentPhase));
    }
    
    function resetElection() external onlyAdmin {
        require(currentPhase == Phase.ENDED, "Not ended");
        
        for (uint256 i = 0; i < registeredVoters.length; i++) {
            address voter = registeredVoters[i];
            isRegistered[voter] = false;
            commitHash[voter] = 0;
            hasRevealed[voter] = false;
        }
        
        delete registeredVoters;
        totalRegistered = 0;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            candidates[i].voteCount = 0;
        }
        
        uint256 registrationDuration = registrationEndTime - (votingEndTime - registrationEndTime);
        uint256 votingDuration = votingEndTime - registrationEndTime;
        uint256 revealDuration = revealEndTime - votingEndTime;
        
        registrationEndTime = block.timestamp + registrationDuration;
        votingEndTime = registrationEndTime + votingDuration;
        revealEndTime = votingEndTime + revealDuration;
        
        currentPhase = Phase.REGISTRATION;
        
        emit ElectionReset();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }
    
    function getPhaseInfo() external view returns (
        uint256 phase,
        uint256 registrationEnd,
        uint256 votingEnd,
        uint256 revealEnd
    ) {
        return (uint256(currentPhase), registrationEndTime, votingEndTime, revealEndTime);
    }
    
    function checkRegistration(address _voter) external view returns (bool) {
        return isRegistered[_voter];
    }
    
    function hasCommitted(address _voter) external view returns (bool) {
        return commitHash[_voter] != 0;
    }
    
    function hasRevealedVote(address _voter) external view returns (bool) {
        return hasRevealed[_voter];
    }
    
    function getTotalVotesCast() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            total += candidates[i].voteCount;
        }
        return total;
    }
    
    function getTotalRegistered() external view returns (uint256) {
        return totalRegistered;
    }
    
    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }
    
    function getVoterStatus(address _voter) external view returns (
        bool registered,
        bool committed,
        bool revealed
    ) {
        return (
            isRegistered[_voter],
            commitHash[_voter] != 0,
            hasRevealed[_voter]
        );
    }
    
    function canAdvancePhase() external view returns (bool, string memory) {
        if (currentPhase == Phase.REGISTRATION) {
            if (block.timestamp < registrationEndTime) {
                return (false, "Registration time not ended");
            }
            if (totalRegistered == 0) {
                return (false, "No voters registered");
            }
            return (true, "Ready to advance");
        }
        else if (currentPhase == Phase.VOTING) {
            if (block.timestamp < votingEndTime) {
                return (false, "Voting time not ended");
            }
            return (true, "Ready to advance");
        }
        else if (currentPhase == Phase.REVEAL) {
            if (block.timestamp < revealEndTime) {
                return (false, "Reveal time not ended");
            }
            return (true, "Ready to advance");
        }
        return (false, "Election ended");
    }
    
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}