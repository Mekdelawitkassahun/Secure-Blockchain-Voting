import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// Get this from https://cloud.walletconnect.com
const projectId = 'a0a4a2a2-8a8a-4a8a-8a8a-8a8a8a8a8a8a';

export const config = getDefaultConfig({
  appName: 'UniVote - Student Government Elections',
  projectId: projectId,
  chains: [sepolia],
  // ... (rest of the config remains the same)
});