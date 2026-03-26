'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VotingABI } from './abis/VotingABI';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ remaining: 0, phase: '' });
  
  // Read contract data
  const { data: candidates, refetch: refetchCandidates } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getCandidates',
  });
  
  const { data: phaseInfo, refetch: refetchPhase } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getPhase',
  });
  
  const { data: remainingTime } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getRemainingTime',
  });
  
  const { data: registeredCount } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getRegisteredCount',
  });
  
  const { data: isUserRegistered } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'isUserRegistered',
    args: address ? [address] : undefined,
  });
  
  const { data: hasUserVoted } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'hasUserVoted',
    args: address ? [address] : undefined,
  });
  
  const { data: result } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getResult',
  });
  
  // Write functions
  const { writeContract: register, data: registerHash, isPending: isRegistering } = useWriteContract();
  const { writeContract: vote, data: voteHash, isPending: isVoting } = useWriteContract();
  const { writeContract: advanceManually, data: advanceHash } = useWriteContract();
  
  useWaitForTransactionReceipt({ 
    hash: registerHash, 
    onSuccess: () => {
      setStatus('✅ Registered successfully!');
      refetchPhase();
    }
  });
  
  useWaitForTransactionReceipt({ 
    hash: voteHash, 
    onSuccess: () => {
      setStatus('✅ Voted successfully!');
      refetchCandidates();
    }
  });
  
  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (remainingTime) {
        const remaining = Number(remainingTime[0]);
        const phase = remainingTime[1];
        setTimeLeft({ remaining, phase: phase as string });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingTime]);
  
  const phase = phaseInfo ? Number(phaseInfo[0]) : 0;
  const phaseName = phaseInfo ? phaseInfo[1] : 'Loading';
  const isRegistrationPhase = phase === 0;
  const isVotingPhase = phase === 1;
  const isResultPhase = phase === 2;
  
  const candidatesList = (candidates as any[]) || [];
  const winner = result ? {
    id: Number(result[0]),
    name: result[1] as string,
    votes: Number(result[2]),
    percentage: Number(result[3]),
    announced: result[4] as boolean
  } : null;
  
  const colors = ['#a855f7', '#3b82f6', '#ec489a', '#10b981', '#f59e0b', '#ef4444'];
  const icons = ['🌱', '⚡', '🎯', '🚀', '🌟', '💪'];
  
  const handleRegister = () => {
    register({
      address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
      abi: VotingABI,
      functionName: 'register',
      args: [],
      gas: 200000n,
    });
    setStatus('Registering...');
  };
  
  const handleVote = () => {
    if (selectedCandidate === null) {
      setStatus('❌ Select a candidate first');
      return;
    }
    
    vote({
      address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
      abi: VotingABI,
      functionName: 'vote',
      args: [BigInt(selectedCandidate)],
      gas: 200000n,
    });
    setStatus('Voting...');
  };
  
  const handleAdvance = () => {
    advanceManually({
      address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
      abi: VotingABI,
      functionName: 'advanceManually',
      args: [],
      gas: 100000n,
    });
    setStatus('Advancing phase...');
  };
  
  // Calculate total votes
  const totalVotes = candidatesList.reduce((sum: number, c: any) => sum + Number(c.voteCount), 0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🗳️ Ethiopian Student Election</h1>
            <p className="text-gray-400 mt-1">Vote for your class representative</p>
          </div>
          <ConnectButton />
        </div>
        
        {!isConnected ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect to participate in the election</p>
          </div>
        ) : (
          <>
            {/* Phase Banner */}
            <div className={`rounded-2xl p-6 mb-8 text-center ${
              isRegistrationPhase ? 'bg-blue-600/20 border border-blue-500' :
              isVotingPhase ? 'bg-green-600/20 border border-green-500' :
              'bg-purple-600/20 border border-purple-500'
            }`}>
              <div className="text-3xl mb-2">
                {isRegistrationPhase && '📝'}
                {isVotingPhase && '🗳️'}
                {isResultPhase && '🏆'}
              </div>
              <h2 className="text-2xl font-bold text-white">{phaseName} Phase</h2>
              {timeLeft.remaining > 0 && (
                <p className="text-gray-300 mt-2">
                  Time remaining: <span className="font-mono text-xl">{timeLeft.remaining}s</span>
                </p>
              )}
              {isRegistrationPhase && registeredCount === 0 && (
                <p className="text-yellow-400 mt-2">Be the first to register and start the 1-minute timer!</p>
              )}
              {isRegistrationPhase && registeredCount > 0 && timeLeft.remaining === 0 && (
                <p className="text-green-400 mt-2">Registration ended! Move to voting...</p>
              )}
            </div>
            
            {/* Registration Section */}
            {isRegistrationPhase && !isUserRegistered && (
              <div className="bg-gray-800 rounded-2xl p-8 mb-8 text-center border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Register to Vote</h3>
                <p className="text-gray-400 mb-4">Register now to participate in the election</p>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-600 transition-all"
                >
                  {isRegistering ? 'Registering...' : '📝 Register Now'}
                </button>
              </div>
            )}
            
            {/* Already Registered Message */}
            {isRegistrationPhase && isUserRegistered && (
              <div className="bg-gray-800 rounded-2xl p-6 mb-8 text-center border border-green-500">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-xl font-semibold text-white mb-2">You Are Registered!</h3>
                <p className="text-gray-400">Wait for the voting phase to begin...</p>
              </div>
            )}
            
            {/* Voting Section */}
            {isVotingPhase && !hasUserVoted && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-6">Choose Your Candidate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {candidatesList.map((candidate: any, idx: number) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(Number(candidate.id))}
                      className={`bg-gray-800 rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                        selectedCandidate === Number(candidate.id)
                          ? 'border-blue-500 shadow-lg shadow-blue-500/30'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      style={{
                        borderColor: selectedCandidate === Number(candidate.id) ? colors[idx] : undefined
                      }}
                    >
                      <div className="text-5xl mb-3 text-center">{icons[idx]}</div>
                      <h3 className="text-xl font-bold text-white text-center">{candidate.name}</h3>
                      <p className="text-sm text-gray-400 italic text-center mb-3">"{candidate.slogan}"</p>
                      
                      <details className="text-sm mt-3">
                        <summary className="text-blue-400 cursor-pointer text-center">Read platform</summary>
                        <div className="mt-3 text-gray-300 text-sm">{candidate.manifesto}</div>
                        <div className="mt-2">
                          {candidate.promises?.split('|').slice(0, 2).map((p: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span>✓</span> {p}
                            </div>
                          ))}
                        </div>
                      </details>
                      
                      {selectedCandidate === Number(candidate.id) && (
                        <div className="mt-3 text-blue-400 text-sm font-medium text-center">Selected ✓</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedCandidate !== null && (
                  <div className="mt-6 bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
                    <p className="text-white mb-4">You selected: <strong className="text-blue-400">{candidatesList[selectedCandidate]?.name}</strong></p>
                    <button
                      onClick={handleVote}
                      disabled={isVoting}
                      className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-600 transition-all"
                    >
                      {isVoting ? 'Voting...' : '🗳️ Confirm Vote'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Already Voted Message */}
            {isVotingPhase && hasUserVoted && (
              <div className="bg-gray-800 rounded-2xl p-8 mb-8 text-center border border-green-500">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-semibold text-white mb-2">You Have Voted!</h3>
                <p className="text-gray-400">Thank you for participating. Waiting for results...</p>
              </div>
            )}
            
            {/* Results Section */}
            {(isResultPhase || (winner && winner.announced)) && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">🏆 Election Results 🏆</h3>
                
                {winner && winner.announced && (
                  <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl p-6 mb-8 text-center border border-yellow-500">
                    <div className="text-5xl mb-3">👑</div>
                    <h4 className="text-3xl font-bold text-yellow-400">{winner.name}</h4>
                    <p className="text-gray-300 mt-2">Winner with {winner.votes} votes ({winner.percentage}%)</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {candidatesList.map((candidate: any, idx: number) => {
                    const voteCount = Number(candidate.voteCount);
                    const percent = totalVotes > 0 ? (voteCount * 100) / totalVotes : 0;
                    
                    return (
                      <div key={candidate.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{icons[idx]}</span>
                            <span className="text-white">{candidate.name}</span>
                          </div>
                          <span className="text-gray-400">{voteCount} votes ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, backgroundColor: colors[idx] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <p className="text-gray-400">Total Votes: <strong className="text-white">{totalVotes}</strong></p>
                  <p className="text-gray-500 text-sm mt-2">Registered Voters: <strong>{registeredCount?.toString() || '0'}</strong></p>
                </div>
              </div>
            )}
            
            {/* Manual Advance Button (for testing) */}
            {!isResultPhase && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleAdvance}
                  className="text-sm text-gray-500 hover:text-gray-400 underline"
                >
                  Force Advance Phase (Admin Only)
                </button>
              </div>
            )}
            
            {/* Status Message */}
            {status && (
              <div className="mt-4 p-3 bg-gray-800 rounded-xl text-center text-gray-300">
                {status}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}