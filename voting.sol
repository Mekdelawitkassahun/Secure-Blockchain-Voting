// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UniVote - Student Government Election System
 * @author Your Name
 * @notice A decentralized voting system for university student representative elections
 * @dev Features: 6 candidates, commit-reveal secret voting, 3-phase election process
 * @dev IMPORTANT: Registration phase will NOT advance until at least 1 student registers
 */
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
        uint256 timestamp;
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
    
    mapping(address => VoteCommitment) public votes;
    mapping(address => bool) public hasRevealed;
    
    Candidate[] public candidates;
    
    // ============ EVENTS ============
    
    event VoterRegistered(address indexed voter, uint256 timestamp);
    event VoteCommitted(address indexed voter, bytes32 commitHash, uint256 timestamp);
    event VoteRevealed(address indexed voter, uint256 candidateId, uint256 timestamp);
    event PhaseAdvanced(uint256 oldPhase, uint256 newPhase, uint256 timestamp);
    event ElectionReset(uint256 timestamp);
    
    // ============ MODIFIERS ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }
    
    modifier inPhase(Phase _phase) {
        require(currentPhase == _phase, getPhaseErrorMessage());
        _;
    }
    
    modifier notEnded() {
        require(currentPhase != Phase.ENDED, "Election has ended");
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
        require(_names.length == 6, "Must have exactly 6 candidates");
        require(_names.length == _slogans.length, "Names and slogans length mismatch");
        require(_names.length == _manifestos.length, "Names and manifestos length mismatch");
        require(_names.length == _promises.length, "Names and promises length mismatch");
        require(_names.length == _colors.length, "Names and colors length mismatch");
        
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
    
    // ============ HELPER FUNCTIONS ============
    
    function getPhaseErrorMessage() private view returns (string memory) {
        if (currentPhase == Phase.REGISTRATION) return "Must be in Registration phase";
        if (currentPhase == Phase.VOTING) return "Must be in Voting phase";
        if (currentPhase == Phase.REVEAL) return "Must be in Reveal phase";
        return "Election has ended";
    }
    
    // ============ REGISTRATION PHASE ============
    
    function register() external notEnded inPhase(Phase.REGISTRATION) {
        require(!isRegistered[msg.sender], "Already registered");
        require(block.timestamp < registrationEndTime, "Registration period ended");
        
        isRegistered[msg.sender] = true;
        registeredVoters.push(msg.sender);
        totalRegistered++;
        
        emit VoterRegistered(msg.sender, block.timestamp);
    }
    
    // ============ VOTING PHASE ============
    
    function commitVote(bytes32 _commitHash) external notEnded inPhase(Phase.VOTING) {
        require(isRegistered[msg.sender], "Not registered to vote");
        require(votes[msg.sender].commitHash == 0, "Already committed a vote");
        require(block.timestamp < votingEndTime, "Voting period ended");
        require(_commitHash != bytes32(0), "Invalid commit hash");
        
        votes[msg.sender] = VoteCommitment({
            commitHash: _commitHash,
            revealed: false,
            timestamp: block.timestamp
        });
        
        emit VoteCommitted(msg.sender, _commitHash, block.timestamp);
    }
    
    // ============ REVEAL PHASE ============
    
    function revealVote(uint256 _candidateId, string memory _secret) external notEnded inPhase(Phase.REVEAL) {
        require(isRegistered[msg.sender], "Not registered to vote");
        require(!hasRevealed[msg.sender], "Vote already revealed");
        require(votes[msg.sender].commitHash != 0, "No vote commitment found");
        require(block.timestamp < revealEndTime, "Reveal period ended");
        require(_candidateId < candidates.length, "Invalid candidate ID");
        
        bytes32 expectedHash = keccak256(abi.encodePacked(_candidateId, _secret));
        require(votes[msg.sender].commitHash == expectedHash, "Invalid secret code");
        
        hasRevealed[msg.sender] = true;
        votes[msg.sender].revealed = true;
        candidates[_candidateId].voteCount++;
        
        emit VoteRevealed(msg.sender, _candidateId, block.timestamp);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Advance to the next election phase (admin only)
     * @notice Registration phase will NOT advance until at least 1 person registers
     */
    function advancePhase() external onlyAdmin {
        uint256 oldPhase = uint256(currentPhase);
        
        if (currentPhase == Phase.REGISTRATION) {
            // REQUIREMENT: Time must have passed AND at least 1 voter must be registered
            require(block.timestamp >= registrationEndTime, "Registration time not ended");
            require(totalRegistered > 0, "Cannot advance: No voters registered. At least one student must register first.");
            currentPhase = Phase.VOTING;
        }
        else if (currentPhase == Phase.VOTING) {
            require(block.timestamp >= votingEndTime, "Voting time not ended");
            currentPhase = Phase.REVEAL;
        }
        else if (currentPhase == Phase.REVEAL) {
            require(block.timestamp >= revealEndTime, "Reveal time not ended");
            currentPhase = Phase.ENDED;
        }
        else {
            revert("Election already ended");
        }
        
        emit PhaseAdvanced(oldPhase, uint256(currentPhase), block.timestamp);
    }
    
    /**
     * @dev Reset the election for a new cycle (admin only)
     */
    function resetElection() external onlyAdmin {
        require(currentPhase == Phase.ENDED, "Can only reset after election ended");
        
        for (uint256 i = 0; i < registeredVoters.length; i++) {
            address voter = registeredVoters[i];
            isRegistered[voter] = false;
            delete votes[voter];
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
        
        emit ElectionReset(block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }
    
    function getCandidate(uint256 _candidateId) external view returns (Candidate memory) {
        require(_candidateId < candidates.length, "Candidate does not exist");
        return candidates[_candidateId];
    }
    
    function getPhaseInfo() external view returns (
        uint256 phase,
        uint256 registrationEnd,
        uint256 votingEnd,
        uint256 revealEnd
    ) {
        return (uint256(currentPhase), registrationEndTime, votingEndTime, revealEndTime);
    }
    
    function getPhaseName() external view returns (string memory) {
        if (currentPhase == Phase.REGISTRATION) return "Registration";
        if (currentPhase == Phase.VOTING) return "Voting";
        if (currentPhase == Phase.REVEAL) return "Reveal";
        return "Ended";
    }
    
    function checkRegistration(address _voter) external view returns (bool) {
        return isRegistered[_voter];
    }
    
    function hasCommitted(address _voter) external view returns (bool) {
        return votes[_voter].commitHash != 0;
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
            votes[_voter].commitHash != 0,
            hasRevealed[_voter]
        );
    }
    
    function canAdvancePhase() external view returns (bool canAdvance, string memory reason) {
        if (currentPhase == Phase.REGISTRATION) {
            if (block.timestamp < registrationEndTime) {
                return (false, "Registration time not ended");
            }
            if (totalRegistered == 0) {
                return (false, "Cannot advance: No voters registered. At least one student must register first.");
            }
            return (true, "Ready to advance to Voting");
        }
        else if (currentPhase == Phase.VOTING) {
            if (block.timestamp < votingEndTime) {
                return (false, "Voting time not ended");
            }
            return (true, "Ready to advance to Reveal");
        }
        else if (currentPhase == Phase.REVEAL) {
            if (block.timestamp < revealEndTime) {
                return (false, "Reveal time not ended");
            }
            return (true, "Ready to advance to Ended");
        }
        return (false, "Election already ended");
    }
    
    function getRegisteredVoters() external view onlyAdmin returns (address[] memory) {
        return registeredVoters;
    }
    
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}