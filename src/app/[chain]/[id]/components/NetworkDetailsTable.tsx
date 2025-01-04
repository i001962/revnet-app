import {
  MAX_RULESET_COUNT,
  RESERVED_TOKEN_SPLIT_GROUP_ID,
} from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNativeTokenSymbol } from "@/hooks/useNativeTokenSymbol";
import { differenceInDays, formatDate } from "date-fns";
import { ForwardIcon } from "@heroicons/react/24/solid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ReservedPercent,
  CashOutTaxRate,
  RulesetWeight,
  WeightCutPercent,
} from "juice-sdk-core";
import {
  useJBContractContext,
  useReadJbControllerGetRulesetOf,
  useReadJbRulesetsAllOf,
  useReadJbSplitsSplitsOf,
  useJBTokenContext,
  useJBChainId,
} from "juice-sdk-react";
import { useState } from "react";
import { twJoin } from "tailwind-merge";
import { PriceSection } from "./NetworkDashboard/sections/PriceSection";
import { useFormattedTokenIssuance } from "@/hooks/useFormattedTokenIssuance";
import { formatTokenSymbol, rulesetStartDate } from "@/lib/utils";
import { useAutoMints } from "@/hooks/useAutomints";
import { commaNumber } from "@/lib/number";
import { formatUnits } from "viem";

export function NetworkDetailsTable() {
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);

  const {
    projectId,
    contracts: { controller },
  } = useJBContractContext();
  const chainId = useJBChainId();

  const { token } = useJBTokenContext();
  const nativeTokenSymbol = useNativeTokenSymbol();
  const [isOpen, setIsOpen] = useState(false);

  // TODO(perf) duplicate call, move to a new context
  const { data: rulesets } = useReadJbRulesetsAllOf({
    chainId,
    args: [projectId, 0n, BigInt(MAX_RULESET_COUNT)],
    query: {
      select(data) {
        return data
          .map((ruleset) => {
            return {
              ...ruleset,
              weight: new RulesetWeight(ruleset.weight),
              weightCutPercent: new WeightCutPercent(ruleset.weightCutPercent),
            };
          })
          .reverse();
      },
    },
  });

  const selectedStage = rulesets?.[selectedStageIdx];

  const selectedStageMetadata = useReadJbControllerGetRulesetOf({
    chainId,
    address: controller.data ?? undefined,
    args: selectedStage?.id ? [projectId, BigInt(selectedStage.id)] : undefined,
    query: {
      select([, rulesetMetadata]) {
        return {
          ...rulesetMetadata,
          cashOutTaxRate: new CashOutTaxRate(rulesetMetadata.cashOutTaxRate),
          reservedPercent: new ReservedPercent(rulesetMetadata.reservedPercent),
        };
      },
    },
  });

  const { data: selectedStateReservedTokenSplits } = useReadJbSplitsSplitsOf({
    chainId,
    args:
      selectedStage && selectedStage
        ? [projectId, BigInt(selectedStage.id), RESERVED_TOKEN_SPLIT_GROUP_ID]
        : undefined,
  });
  const selectedStageBoost = selectedStateReservedTokenSplits?.[0];
  const reservedPercent = selectedStageMetadata?.data?.reservedPercent;
  const stages = rulesets?.reverse();
  const nextStageIdx = Math.max(
    stages?.findIndex((stage) => stage.start > Date.now() / 1000) ?? -1,
    1 // lower bound should be 1 (the minimum 'next stage' is 1)
  );
  const currentStageIdx = nextStageIdx - 1;

  const len = rulesets?.length ?? 0;
  const reverseSelectedIdx = len - selectedStageIdx - 1;
  const stageDayDiff = () => {
    const selectedRuleset = rulesets?.[reverseSelectedIdx];
    const selectedStart = rulesetStartDate(selectedRuleset);

    const nextRuleset = rulesets?.[reverseSelectedIdx - 1];
    const nextStart = rulesetStartDate(nextRuleset);
    if (!nextStart || !selectedStart) return "";

    const days = differenceInDays(nextStart, selectedStart);
    return `, ${days} days`;
  };

  const stageNextStart = () => {
    const selectedRuleset = rulesets?.[reverseSelectedIdx];
    const selectedStart = rulesetStartDate(selectedRuleset);

    const nextRuleset = rulesets?.[reverseSelectedIdx - 1];
    const nextStart = rulesetStartDate(nextRuleset);
    if (!nextStart || !selectedStart) return "forever";

    return formatDate(
      nextStart,
      "MMM dd, yyyy"
    );
  };

  const issuance = useFormattedTokenIssuance({
    weight: selectedStage?.weight,
    reservedPercent: selectedStageMetadata?.data?.reservedPercent,
  });

  const autoMints = useAutoMints();
  const getAutoMintsTotalForStage = () => {
    if (!autoMints) return 0;
    const stageAutoMints = autoMints.filter((a) => a.stage === selectedStageIdx + 1);
    return commaNumber(formatUnits(
      stageAutoMints.reduce((acc, curr) => acc + BigInt(curr.count), 0n),
      token?.data?.decimals || 18
    ));
  };

  if (!selectedStage) return null;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Dropdown Header */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 text-left text-notWhite"
      >
        <div className="flex flex-row space-x-2">
          <h2 className="text-2xl font-semibold">How it works</h2>
        </div>
        <span
          className={`transform transition-transform font-sm ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
        >
          ▶
        </span>
      </button>
      {/* Dropdown Content */}
      {isOpen && (
        <div className="mt-2 text-lightPurple text-md max-w-sm sm:max-w-full">
          <h3 className="text-md text-notWhite font-semibold mt-4">Overview</h3>
          <PriceSection className="mb-2" />
          <h3 className="text-md text-notWhite font-semibold mt-6">Rules</h3>
          <div className="mb-2 mt-2 text-lightPurple font-light italic">
            {formatTokenSymbol(token)}'s issuance and cash out rules change automatically in permanent sequential stages.
          </div>
          <div className="mb-2">
            <div className="flex gap-4 mb-2">
              {rulesets?.map((ruleset, idx) => {
                return (
                  <Button
                    variant={selectedStageIdx === idx ? "tab-selected" : "bottomline"}
                    className={twJoin(
                      "text-md text-lightPurple",
                      selectedStageIdx === idx && "text-inherit"
                    )}
                    key={ruleset.id.toString() + idx}
                    onClick={() => setSelectedStageIdx(idx)}
                  >
                    Stage {idx + 1}
                    {idx === currentStageIdx && (
                      <span className="rounded-full h-2 w-2 bg-notWhite border-[2px] border-orange-200 ml-1"></span>
                    )}
                  </Button>
                );
              })}
            </div>
            <div className="text-md text-lightPurple mb-2">
              {formatDate(new Date(Number(selectedStage.start) * 1000), "MMM dd, yyyy")} - {stageNextStart()}{stageDayDiff()}
            </div>
            <div className="grid sm:grid-cols-1 gap-x-8 overflow-x-scroll gap-1">
              <div className="sm:col-span-1 sm:px-0 grid grid-cols-2 sm:grid-cols-4">
                <dt className="text-md font-medium leading-6 text-lightPurple">
                  <Tooltip>
                    <div className="flex flex-row space-x-1">
                      <div>Paid issuance</div>
                      <TooltipTrigger className="pl-1 text-md text-zinc-500"> [ ? ]</TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-md space-y-2 p-2">
                          <div className="space-y-1">
                            <h3 className="font-bold text-black-500">Paid Issuance</h3>
                            <p className="text-md text-black-400">
                              Determines how many {formatTokenSymbol(token)} are created when this revnet receives funds during a stage.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </div>
                  </Tooltip>
                </dt>
                <dd className="text-md leading-6 text-lightPurple whitespace-nowrap">
                  {issuance}, cut {selectedStage.weightCutPercent.formatPercentage()}% every{" "}
                  {(selectedStage.duration / 86400).toString()} days
                </dd>
              </div>
              <div className="sm:col-span-1 sm:px-0 grid grid-cols-2 sm:grid-cols-4">
                <dt className="text-md font-medium leading-6 text-lightPurple">
                  <Tooltip>
                    <div className="flex flex-row space-x-1">
                      <div>Auto issuance</div>
                      <TooltipTrigger className="pl-1 text-md text-zinc-500"> [ ? ]</TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-md space-y-2 p-2">
                          <div className="space-y-1">
                            <h3 className="font-bold text-black-500">Auto issuance</h3>
                            <p className="text-md text-black-400">
                              An amount of {formatTokenSymbol(token)} that is inflated automatically once the stage starts.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </div>
                  </Tooltip>
                </dt>
                <dd className="text-md leading-6 text-lightPurple whitespace-nowrap">
                  {getAutoMintsTotalForStage()} {formatTokenSymbol(token)}
                </dd>
              </div>
              <div className="sm:col-span-1 sm:px-0 grid grid-cols-2 sm:grid-cols-4">
                <dt className="text-md font-medium leading-6 text-lightPurple">
                  <Tooltip>
                    <div className="flex flex-row space-x-1">
                      <div>Splits</div>
                      <TooltipTrigger className="pl-1 text-md text-zinc-500"> [ ? ]</TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-md space-y-2 p-2">
                          <div className="space-y-1">
                            <h3 className="font-bold text-black-500">Splits</h3>
                            <p className="text-md text-black-400">
                              Determines how much of {formatTokenSymbol(token)} issuance is set aside to be split among recipients defined by the split operator during a stage.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </div>
                  </Tooltip>
                </dt>
                <dd className="text-md leading-6 text-lightPurple whitespace-nowrap">
                  {selectedStageBoost ? (
                    <div className="text-md leading-6 text-lightPurple">
                      {reservedPercent?.formatPercentage()}% split to{" "}
                      <Badge variant="secondary" className="border border-visible">
                        <ForwardIcon className="w-4 h-4 mr-1 inline-block" />
                        Operator
                      </Badge>
                    </div>
                  ) : null}
                </dd>
              </div>
              <div className="sm:col-span-1 sm:px-0 grid grid-cols-2 sm:grid-cols-4">
                <dt className="text-md font-medium leading-6 text-lightPurple">
                  <Tooltip>
                    <div className="flex flex-row space-x-1">
                      <div>Cash out tax rate</div>
                      <TooltipTrigger className="pl-1 text-md text-zinc-500"> [ ? ]</TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="max-w-md space-y-2 p-2">
                          <div className="space-y-1">
                            <h3 className="font-bold text-black-500">Cash out tax rate</h3>
                            <p className="text-md text-black-400">
                              All {formatTokenSymbol(token)} holders can access revenue by either cashing out their {formatTokenSymbol(token)}, or taking out a loan against their {formatTokenSymbol(token)}.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </div>
                  </Tooltip>
                </dt>
                <dd className="text-md leading-6 text-lightPurple">
                  {new CashOutTaxRate(Number(selectedStageMetadata?.data?.cashOutTaxRate.value ?? 0n)).format()}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
