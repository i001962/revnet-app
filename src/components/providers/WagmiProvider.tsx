import { createConfig, http, WagmiProvider } from "wagmi";
import { arbitrumSepolia, base, baseSepolia, optimismSepolia, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { frameConnector } from "../../lib/connector";

export const config = createConfig({
  chains: [sepolia, optimismSepolia, baseSepolia, arbitrumSepolia],
  transports: {
    [sepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  connectors: [frameConnector()],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}