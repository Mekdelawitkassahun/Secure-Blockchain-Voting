export const VotingABI = [
  {
    "inputs": [
      { "internalType": "string[]", "name": "_names", "type": "string[]" },
      { "internalType": "string[]", "name": "_slogans", "type": "string[]" },
      { "internalType": "string[]", "name": "_manifestos", "type": "string[]" },
      { "internalType": "string[]", "name": "_promises", "type": "string[]" },
      { "internalType": "string[]", "name": "_colors", "type": "string[]" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  { "inputs": [], "name": "advanceManually", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "announceResult", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "canAdvance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "candidates", "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "slogan", "type": "string" }, { "internalType": "string", "name": "manifesto", "type": "string" }, { "internalType": "string", "name": "promises", "type": "string" }, { "internalType": "string", "name": "color", "type": "string" }, { "internalType": "uint256", "name": "voteCount", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "currentPhase", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getAllResults", "outputs": [{ "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }, { "internalType": "string[]", "name": "names", "type": "string[]" }, { "internalType": "uint256[]", "name": "voteCounts", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "percentages", "type": "uint256[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }], "name": "getCandidate", "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "slogan", "type": "string" }, { "internalType": "string", "name": "manifesto", "type": "string" }, { "internalType": "string", "name": "promises", "type": "string" }, { "internalType": "string", "name": "color", "type": "string" }, { "internalType": "uint256", "name": "voteCount", "type": "uint256" }], "internalType": "struct AutoElection.Candidate", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }], "name": "getCandidatePercentage", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getCandidates", "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "slogan", "type": "string" }, { "internalType": "string", "name": "manifesto", "type": "string" }, { "internalType": "string", "name": "promises", "type": "string" }, { "internalType": "string", "name": "color", "type": "string" }, { "internalType": "uint256", "name": "voteCount", "type": "uint256" }], "internalType": "struct AutoElection.Candidate[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getCurrentTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getPhase", "outputs": [{ "internalType": "uint256", "name": "phase", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getRegisteredCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getRegisteredVoters", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getRemainingTime", "outputs": [{ "internalType": "uint256", "name": "remaining", "type": "uint256" }, { "internalType": "string", "name": "phase", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getResult", "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "votes", "type": "uint256" }, { "internalType": "uint256", "name": "percentage", "type": "uint256" }, { "internalType": "bool", "name": "announced", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getTotalVotes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getUserVote", "outputs": [{ "internalType": "uint256", "name": "candidateId", "type": "uint256" }, { "internalType": "string", "name": "candidateName", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "hasUserVoted", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "isUserRegistered", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "register", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "registrationEndTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "registrationStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "resultAnnounced", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalVotes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }], "name": "vote", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "votingEndTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "votingStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "winnerId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "winnerName", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "winnerVotes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

// IMPORTANT: Replace with your deployed contract address
export const VOTING_CONTRACT_ADDRESS = "0xade946326431C8e1B660c6551DB4d54d69e887BD";