'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VotingABI } from '../abis/VotingABI';

export function CandidatesGrid() {
  const { address } = useAccount();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [secret, setSecret] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  
  const { data: candidates } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getCandidates',
  });
  
  const { data: phaseInfo } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: VotingABI,
    functionName: 'getPhaseInfo',
  });
  
  const currentPhase = phaseInfo ? Number(phaseInfo[0]) : 0;
  const isVotingPhase = currentPhase === 1;
  
  const { writeContract: commitVote, data: commitHash, isPending: isCommitting } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ 
    hash: commitHash,
    onSuccess: (data) => {
      console.log('Vote committed successfully:', data);
      setStatus('✅ Vote committed! Save your secret for reveal phase.');
    },
    onError: (error) => {
      console.error('Vote commit failed:', error);
      setStatus(`❌ Vote commit failed: ${error.message}`);
    }
  });
  
  // University representative candidates for testing
  const universityCandidates = [
    {
      id: 0,
      name: "Sarah Chen",
      slogan: "Innovation in Education",
      manifesto: "As a Computer Science major with a passion for educational technology, I believe in leveraging technology to enhance learning experiences. My platform focuses on modernizing our university's digital infrastructure and creating more opportunities for student innovation.",
      promises: "Free coding workshops| upgraded campus WiFi| student tech incubator| 24/7 study spaces| industry partnerships",
      color: "#3B82F6",
      voteCount: 0
    },
    {
      id: 1,
      name: "Marcus Johnson",
      slogan: "Community First",
      manifesto: "I'm a Sociology student dedicated to building a stronger campus community. My vision includes mental health support, diversity initiatives, and creating inclusive spaces where every student feels valued and heard.",
      promises: "Expanded mental health services| cultural awareness programs| peer support networks| inclusive campus events| accessibility improvements",
      color: "#10B981",
      voteCount: 0
    },
    {
      id: 2,
      name: "Emily Rodriguez",
      slogan: "Sustainable Future",
      manifesto: "As an Environmental Science major, I'm committed to making our campus a leader in sustainability. I'll push for green initiatives, waste reduction programs, and environmental education that benefits both students and the planet.",
      promises: "Campus-wide recycling program| solar panel installation| community garden| carbon neutral events| sustainability curriculum",
      color: "#059669",
      voteCount: 0
    },
    {
      id: 3,
      name: "David Kim",
      slogan: "Student Success",
      manifesto: "I'm a Business Administration student focused on practical solutions that improve student life. My platform addresses academic support, career preparation, and financial accessibility to ensure every student can succeed.",
      promises: "Free tutoring services| career development workshops| textbook exchange program| scholarship database| alumni mentorship",
      color: "#7C3AED",
      voteCount: 0
    },
    {
      id: 4,
      name: "Aisha Patel",
      slogan: "Arts & Culture",
      manifesto: "As a Fine Arts major, I believe in the power of creative expression to enrich campus life. I'll advocate for more arts funding, cultural events, and spaces where students can showcase their talents and celebrate diversity.",
      promises: "Student art gallery| cultural festivals| music practice rooms| creative writing workshops| theater funding",
      color: "#DC2626",
      voteCount: 0
    },
    {
      id: 5,
      name: "James Thompson",
      slogan: "Athletics & Wellness",
      manifesto: "I'm a Kinesiology student passionate about student health and athletics. My platform focuses on improving sports facilities, wellness programs, and creating opportunities for students to stay active and healthy.",
      promises: "Gym equipment upgrades| intramural sports expansion| mental wellness programs| nutrition counseling| fitness classes",
      color: "#EA580C",
      voteCount: 0
    }
  ];
  
  const candidatesList = candidates && candidates.length > 0 ? (candidates as any[]) : universityCandidates;
  const icons = ['💻', '🤝', '🌱', '📚', '🎨', '⚽'];
  
  const calculateHash = async (candidateId: number, secretStr: string) => {
    const message = `${candidateId}${secretStr}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const handleCommit = async () => {
  console.log("=== COMMIT DEBUG ===");
  console.log("Selected candidate:", selectedCandidate);
  console.log("Secret:", secret);
  
  if (selectedCandidate === null) {
    setStatus('❌ Select a candidate first');
    return;
  }
  if (!secret) {
    setStatus('❌ Generate a secret first');
    return;
  }
  
  try {
    // Calculate hash
    const message = `${selectedCandidate}${secret}`;
    console.log("Message to hash:", message);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log("Generated hash:", hash);
    console.log("Hash length:", hash.length);
    
    // Store in localStorage BEFORE sending transaction
    if (address) {
      localStorage.setItem(`vote_secret_${address}`, secret);
      localStorage.setItem(`vote_candidate_${address}`, selectedCandidate.toString());
      console.log("Saved to localStorage - secret:", secret);
      console.log("Saved to localStorage - candidate:", selectedCandidate);
    }
    
    // Send transaction
    console.log("Sending transaction with hash:", hash);
    console.log("Contract address:", VOTING_CONTRACT_ADDRESS);
    console.log("Contract address length:", VOTING_CONTRACT_ADDRESS.length);
    console.log("Contract address format:", VOTING_CONTRACT_ADDRESS.startsWith('0x') ? 'Valid hex format' : 'Invalid format');
    
    try {
      // Ensure address is properly formatted
      const contractAddress = VOTING_CONTRACT_ADDRESS as `0x${string}`;
      console.log("Formatted contract address:", contractAddress);
      
      const result = await commitVote({
        address: contractAddress,
        abi: VotingABI,
        functionName: 'commitVote',
        args: [hash as `0x${string}`],
        gas: 120000, // Optimized gas limit for commit vote
      });
      
      console.log("Transaction result:", result);
      setStatus('🔒 Committing vote... Check console for details');
      
    } catch (txError) {
      console.error("Transaction error:", txError);
      if (txError instanceof Error) {
        setStatus(`❌ Transaction failed: ${txError.message}`);
      } else {
        setStatus(`❌ Transaction failed: ${JSON.stringify(txError)}`);
      }
    }
    
  } catch (error) {
    console.error("Commit error:", error);
    setStatus(`❌ Error: ${(error as Error).message}`);
  }
};

const generateSecret = () => {
  const newSecret = Math.random().toString(36).substring(2) + Date.now().toString();
  setSecret(newSecret);
  
  // Also store immediately so it's saved
  if (address) {
    localStorage.setItem(`vote_secret_temp_${address}`, newSecret);
  }
  
  setStatus('🔐 Secret generated! Save this code: ' + newSecret);
  console.log("Generated secret:", newSecret);
};
  
  if (!isVotingPhase) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-5xl mb-3">🕰️</div>
        <p className="text-gray-500">Candidates will appear when voting phase begins</p>
      </div>
    );
  }
  
  if (candidatesList.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-gray-500">Loading candidates...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidatesList.map((candidate: any, index: number) => (
          <div
            key={candidate.id}
            onClick={() => setSelectedCandidate(Number(candidate.id))}
            className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${
              selectedCandidate === Number(candidate.id)
                ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="text-5xl mb-3">{icons[index % icons.length]}</div>
              <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
              <p className="text-sm text-gray-500 italic mb-3">"{candidate.slogan}"</p>
              
              <details className="text-sm w-full">
                <summary className="text-blue-600 cursor-pointer hover:text-blue-700">
                  Read platform
                </summary>
                <div className="mt-3 space-y-3 text-left">
                  <p className="text-gray-600 text-sm">{candidate.manifesto}</p>
                  <div className="border-t pt-2">
                    <p className="font-medium text-gray-700 text-xs mb-1">Key promises:</p>
                    {candidate.promises?.split('|').map((promise: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 mt-1">
                        <span className="text-green-500">✓</span>
                        <span className="text-xs">{promise}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
              
              {selectedCandidate === Number(candidate.id) && (
                <div className="mt-3 text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-full">
                  Selected ✓
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedCandidate !== null && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">
                Ready to vote for {candidatesList.find(c => c.id === selectedCandidate)?.name}?
              </h4>
              <p className="text-sm text-gray-500">Generate a secret to hide your vote</p>
            </div>
            <button
              onClick={generateSecret}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              Generate Secret
            </button>
          </div>
          
          {secret && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-700 mb-1 font-medium">⚠️ SAVE THIS SECRET CODE</p>
              <code className="text-sm font-mono break-all">{secret}</code>
              <p className="text-xs text-yellow-600 mt-1">You will need this to reveal your vote later!</p>
            </div>
          )}
          
          <button
            onClick={handleCommit}
            disabled={!secret || isCommitting || isConfirming}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isCommitting || isConfirming ? 'Committing...' : 'Commit Vote'}
          </button>
          
          {status && <p className="mt-3 text-sm text-center text-gray-600">{status}</p>}
        </div>
      )}
    </div>
  );
}