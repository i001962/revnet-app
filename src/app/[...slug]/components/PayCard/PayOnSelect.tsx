import { useState, useEffect } from "react";
import { JB_CHAINS, SuckerPair } from "juice-sdk-core";
import { JBChainId, useJBChainId, useSuckers } from "juice-sdk-react";
import { useSelectedSucker } from "./SelectedSuckerContext";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function PayOnSelect() {
  const suckersQuery = useSuckers();
  const chainId = useJBChainId();
  const suckers = suckersQuery.data;
  const { selectedSucker, setSelectedSucker } = useSelectedSucker();

  useEffect(() => {
    if (!selectedSucker && suckers?.length) {
      const defaultSucker = suckers.find((s) => Number(chainId) === Number(s.peerChainId));
      if (defaultSucker) setSelectedSucker(defaultSucker);
    }
  }, [suckers, chainId, selectedSucker, setSelectedSucker]);

  if (!suckers || suckers.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-row items-center gap-1">
      <span className="text-md text-black-700">on</span>
      <Select
        onValueChange={(value: string) => {
          const next = suckers?.find((s) => Number(s.peerChainId) === Number(value));
          if (next) setSelectedSucker(next);
        }}
        value={selectedSucker ? String(selectedSucker.peerChainId) : undefined}
      >
        <SelectTrigger className="underline bg-transparent border-none p-0 h-auto text-md text-black-700">
          <SelectValue placeholder="pick a chain" />
        </SelectTrigger>
        <SelectContent className="z-[70]">
          {suckers?.map((sucker) => (
            <SelectItem key={sucker.peerChainId} value={String(sucker.peerChainId)}>
              {JB_CHAINS[sucker.peerChainId as JBChainId]?.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
