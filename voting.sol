// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Blockchain Voting System
 * @author Your Name
 * @notice A secure, transparent, and tamper-proof voting system with secret ballots
 * @dev Implements commit-reveal pattern for voter privacy
 */
contract Voting {
    // ============ STRUCTS ============
    
    /**
     * @dev Candidate structure with complete campaign information
     * @param id Unique identifier for the candidate
     * @param name Candidate's full name
     * @param slogan Campaign slogan/tagline
     * @param manifesto Detailed campaign platform
     * @param promises Key promises (pipe-separated for frontend parsing)
     * @param color Hex color code for UI branding
     * @param voteCount Total number of votes received
     */
    struct Candidate {
        uint256 id;
        string name;
        string slogan;
        string manifesto;
        string promises;
        string color;
        uint256 voteCount;
    }
    
    /**
     * @dev Vote commitment structure for secret ballot
     * @param hash keccak256(candidateId + secret)
     * @param timestamp When the commitment was made
     * @param revealed Whether the vote has been revealed
     */
    struct Commitment {
        bytes32 hash;
        uint256 timestamp;
        bool revealed;
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Contract administrator (deployer)
    address public admin;
    
    /// @notice Election phases
    enum Phase { REGISTRATION, VOTING, REVEAL, ENDED }
    Phase public phase;
    
    /// @notice Phase timestamps (Unix time in seconds)
    uint256 public registrationEndTime;
    uint256 public votingEndTime;
    uint256 public revealEndTime;
    
    /// @notice Voter registration
    mapping(address => bool) public isRegistered;
    address[] public registeredVoters;
    uint256 public registeredCount;
    
    /// @notice Vote tracking
    mapping(address => Commitment) public commitments;
    mapping(address => bool) public hasRevealed;
    
    /// @notice Candidates
    Candidate[] public candidates;
    mapping(uint256 => bool) private candidateExists;
    
    /// @notice Emergency controls
    bool public paused;
    
    // ============ EVENTS ============
    
    /// @notice Emitted when a new voter is registered
    event VoterRegistered(address indexed voter);
    
    /// @notice Emitted when a vote is committed
    event VoteCommitted(address indexed voter, bytes32 commitHash);
    
    /// @notice Emitted when a vote is revealed
    event VoteRevealed(address indexed voter, uint256 candidateId);
    
    /// @notice Emitted when the election phase changes
    event PhaseChanged(Phase newPhase);
    
    /// @notice Emitted when contract is paused or unpaused
    event ContractPaused(bool paused);
    
    /// @notice Emitted when admin is transferred
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    
    // ============ MODIFIERS ============
    
    /// @dev Restrict access to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    /// @dev Prevent execution when contract is paused
    modifier notPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    /// @dev Require specific election phase
    modifier inPhase(Phase _phase) {
        require(phase == _phase, "Wrong phase");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Deploy the voting contract with candidates and campaign details
     * @param _names Array of candidate names
     * @param _slogans Array of campaign slogans
     * @param _manifestos Array of detailed manifestos
     * @param _promises Array of pipe-separated key promises
     * @param _colors Array of hex color codes for UI
     * @param _registrationDurationMinutes Duration of registration phase in minutes
     * @param _votingDurationMinutes Duration of voting phase in minutes
     * @param _revealDurationMinutes Duration of reveal phase in minutes
     */
    constructor(
        string[] memory _names,
        string[] memory _slogans,
        string[] memory _manifestos,
        string[] memory _promises,
        string[] memory _colors,
        uint256 _registrationDurationMinutes,
        uint256 _votingDurationMinutes,
        uint256 _revealDurationMinutes
    ) {
        // Validate input arrays
        require(_names.length == _slogans.length, "Array length mismatch: slogans");
        require(_names.length == _manifestos.length, "Array length mismatch: manifestos");
        require(_names.length == _promises.length, "Array length mismatch: promises");
        require(_names.length == _colors.length, "Array length mismatch: colors");
        require(_names.length > 0, "At least one candidate required");
        
        admin = msg.sender;
        
        // Set phase timestamps
        registrationEndTime = block.timestamp + (_registrationDurationMinutes * 1 minutes);
        votingEndTime = registrationEndTime + (_votingDurationMinutes * 1 minutes);
        revealEndTime = votingEndTime + (_revealDurationMinutes * 1 minutes);
        
        phase = Phase.REGISTRATION;
        paused = false;
        
        // Add candidates with campaign details
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
            candidateExists[i] = true;
        }
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Register multiple voters (admin only)
     * @param _voters Array of wallet addresses to register
     */
    function registerVoters(address[] calldata _voters) 
        external 
        onlyAdmin 
        notPaused 
        inPhase(Phase.REGISTRATION) 
    {
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            if (!isRegistered[voter]) {
                isRegistered[voter] = true;
                registeredVoters.push(voter);
                registeredCount++;
                emit VoterRegistered(voter);
            }
        }
    }
    
    /**
     * @dev Advance to the next election phase (admin only)
     * Can only be called after current phase duration has elapsed
     */
    function advancePhase() external onlyAdmin {
        if (phase == Phase.REGISTRATION) {
            require(block.timestamp >= registrationEndTime, "Registration phase not ended");
            phase = Phase.VOTING;
            emit PhaseChanged(Phase.VOTING);
        } 
        else if (phase == Phase.VOTING) {
            require(block.timestamp >= votingEndTime, "Voting phase not ended");
            phase = Phase.REVEAL;
            emit PhaseChanged(Phase.REVEAL);
        } 
        else if (phase == Phase.REVEAL) {
            require(block.timestamp >= revealEndTime, "Reveal phase not ended");
            phase = Phase.ENDED;
            emit PhaseChanged(Phase.ENDED);
        }
    }
    
    /**
     * @dev Emergency pause/unpause (admin only)
     * @param _paused True to pause, false to unpause
     */
    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit ContractPaused(_paused);
    }
    
    /**
     * @dev Transfer admin privileges to a new address
     * @param _newAdmin Address of the new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        emit AdminTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }
    
    // ============ VOTER FUNCTIONS ============
    
    /**
     * @dev Commit a vote (Voting phase only)
     * @param _commitHash keccak256(candidateId + secret)
     */
    function commitVote(bytes32 _commitHash) 
        external 
        notPaused 
        inPhase(Phase.VOTING) 
    {
        require(isRegistered[msg.sender], "Not registered");
        require(commitments[msg.sender].hash == 0, "Already committed");
        require(_commitHash != bytes32(0), "Invalid commit hash");
        
        commitments[msg.sender] = Commitment({
            hash: _commitHash,
            timestamp: block.timestamp,
            revealed: false
        });
        
        emit VoteCommitted(msg.sender, _commitHash);
    }
    
    /**
     * @dev Reveal a committed vote (Reveal phase only)
     * @param _candidateId The candidate voted for
     * @param _secret The secret used when committing
     */
    function revealVote(uint256 _candidateId, string memory _secret) 
        external 
        notPaused 
        inPhase(Phase.REVEAL) 
    {
        require(isRegistered[msg.sender], "Not registered");
        require(!commitments[msg.sender].revealed, "Already revealed");
        require(candidateExists[_candidateId], "Invalid candidate");
        
        Commitment memory commit = commitments[msg.sender];
        require(commit.hash != 0, "No commitment found");
        
        // Verify the secret matches the commitment hash
        bytes32 expectedHash = keccak256(abi.encodePacked(_candidateId, _secret));
        require(commit.hash == expectedHash, "Invalid secret");
        
        // Mark as revealed and count the vote
        commitments[msg.sender].revealed = true;
        hasRevealed[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        
        emit VoteRevealed(msg.sender, _candidateId);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get all candidates with their campaign details and vote counts
     * @return Array of all Candidate structs
     */
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }
    
    /**
     * @dev Get total number of candidates
     * @return Candidate count
     */
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
    
    /**
     * @dev Check if a specific address is registered to vote
     * @param _voter Address to check
     * @return True if registered
     */
    function checkRegistration(address _voter) external view returns (bool) {
        return isRegistered[_voter];
    }
    
    /**
     * @dev Get current election phase information
     * @return currentPhase Current phase
     * @return registrationEnd End time of registration
     * @return votingEnd End time of voting
     * @return revealEnd End time of reveal
     * @return isPaused Whether contract is paused
     */
    function getPhaseInfo() external view returns (
        Phase currentPhase,
        uint256 registrationEnd,
        uint256 votingEnd,
        uint256 revealEnd,
        bool isPaused
    ) {
        return (phase, registrationEndTime, votingEndTime, revealEndTime, paused);
    }
    
    /**
     * @dev Get total number of revealed votes across all candidates
     * @return Total vote count
     */
    function getTotalRevealedVotes() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            total += candidates[i].voteCount;
        }
        return total;
    }
    
    /**
     * @dev Get total number of registered voters
     * @return Registered voter count
     */
    function getRegisteredCount() external view returns (uint256) {
        return registeredCount;
    }
    
    /**
     * @dev Check if a voter has committed a vote
     * @param _voter Address to check
     * @return True if committed
     */
    function hasCommitted(address _voter) external view returns (bool) {
        return commitments[_voter].hash != 0;
    }
    
    /**
     * @dev Get complete voting status for a voter
     * @param _voter Address to check
     * @return registered Registration status
     * @return committed Commitment status
     * @return revealed Reveal status
     */
    function getVoterStatus(address _voter) external view returns (
        bool registered,
        bool committed,
        bool revealed
    ) {
        return (
            isRegistered[_voter],
            commitments[_voter].hash != 0,
            commitments[_voter].revealed
        );
    }
    
    /**
     * @dev Get detailed information for a specific candidate
     * @param _candidateId Candidate ID
     * @return name Candidate name
     * @return slogan Campaign slogan
     * @return manifesto Detailed manifesto
     * @return promises Key promises
     * @return color UI color code
     * @return voteCount Votes received
     */
    function getCandidateDetails(uint256 _candidateId) external view returns (
        string memory name,
        string memory slogan,
        string memory manifesto,
        string memory promises,
        string memory color,
        uint256 voteCount
    ) {
        require(candidateExists[_candidateId], "Candidate does not exist");
        Candidate memory c = candidates[_candidateId];
        return (c.name, c.slogan, c.manifesto, c.promises, c.color, c.voteCount);
    }
    
    /**
     * @dev Check if contract is still active (not ended and not paused)
     * @return True if active
     */
    function isContractActive() external view returns (bool) {
        return phase != Phase.ENDED && !paused;
    }
    
    /**
     * @dev Get current time (helper for frontend)
     * @return Current block timestamp
     */
    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }
}