import { ipfsGatewayUrl } from "@/lib/ipfs";
import { JBProjectMetadata } from "@/types/juicebox";
import { useQuery } from "react-query";

export function useProjectMetadata(metadataCid: string | undefined | null) {
  return useQuery(
    [metadataCid],
    async () => {
      if (!metadataCid) return null;

      const response = (await fetch(ipfsGatewayUrl(metadataCid)).then((res) =>
        res.json()
      )) as JBProjectMetadata;

      console.log(response);

      return response;
    },
    {
      enabled: !!metadataCid,
    }
  );
}