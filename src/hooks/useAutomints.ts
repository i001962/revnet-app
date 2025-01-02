import { useMemo } from "react";
import { useSubgraphQuery } from "@/graphql/useSubgraphQuery";
import { StoreAutoMintAmountEventsDocument } from "@/generated/graphql";
import {
  useJBChainId,
  useJBContractContext,
  useReadJbRulesetsAllOf
} from "juice-sdk-react";
import { MAX_RULESET_COUNT } from "@/app/constants";

export function useAutoMints() {
  const { projectId } = useJBContractContext();

  const chainId = useJBChainId();

  const { data: autoMintsData } = useSubgraphQuery(
    StoreAutoMintAmountEventsDocument,
    {
      where: { revnetId: String(projectId) },
<<<<<<< HEAD
=======
      first: 1,
>>>>>>> 9acf630 (fix(automints): fix up automints, refine homepage to open links in same window new one got annoying)
    }
  );

  const { data: rulesets } = useReadJbRulesetsAllOf({
    chainId,
    args: [projectId, 0n, BigInt(MAX_RULESET_COUNT)],
  });

  const autoMints = useMemo(() => {
<<<<<<< HEAD
=======
    console.log("rulesets?.length", rulesets?.length)
>>>>>>> 9acf630 (fix(automints): fix up automints, refine homepage to open links in same window new one got annoying)
    return autoMintsData?.storeAutoMintAmountEvents.map((automint) => {
      const rulesetIndex =
        rulesets?.findIndex((r) => String(r.id) === automint.stageId) || 0;
      return {
        ...automint,
        startsAt: rulesets?.[rulesetIndex].start,
        stage: (rulesets?.length || 0) - rulesetIndex,
      };
    });
  }, [autoMintsData, rulesets]);
  return autoMints;
}
