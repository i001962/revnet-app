"use client";

import dynamic from "next/dynamic";

const WagmiProvider = dynamic(
  () => import("./WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="soft"
          mode="light"
          customTheme={{
            "--ck-font-family": "var(--font-simplon-norm)",
            "--ck-connectbutton-border-radius": "0",
            "--ck-accent-color": "#14B8A6",
            "--ck-accent-text-color": "#ffffff",
          }}
        >
          <TooltipProvider delayDuration={200} skipDelayDuration={100}>
            {mounted && children}
          </TooltipProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}