"use client";

import { wagmiConfig } from "@/lib/wagmiConfig";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import dynamic from "next/dynamic";
import React from "react";

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