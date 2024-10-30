"use client";

import EtherscanLink from "@/components/EtherscanLink";
import { Nav } from "@/components/layout/Nav";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNativeTokenSymbol } from "@/hooks/useNativeTokenSymbol";
import { ipfsUri, ipfsUriToGatewayUrl } from "@/lib/ipfs";
import { createSalt } from "@/lib/number";
import {
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  FieldArray,
  FieldAttributes,
  Form,
  Formik,
  Field as FormikField,
  useFormikContext,
} from "formik";
import {
  DecayPercent,
  JBProjectMetadata,
  NATIVE_TOKEN,
  NATIVE_TOKEN_DECIMALS,
  RedemptionRate,
  ReservedPercent,
} from "juice-sdk-core";
import { JBChainId, useChain } from "juice-sdk-react";
import { FastForwardIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { revDeployerAbi } from "revnet-sdk";
import { twMerge } from "tailwind-merge";
import {
  Address,
  Chain,
  ContractFunctionParameters,
  encodeFunctionData,
  parseUnits,
  zeroAddress,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { IpfsImageUploader } from "../../components/IpfsFileUploader";
import { ChainIdToChain, chainIdMap, chainNames, MAX_RULESET_COUNT } from "../constants";
import { useDeployRevnetRelay } from "@/lib/relayr/hooks/useDeployRevnetRelay";
import { RelayrAPIResponse } from "@/lib/relayr/types";
import { formatHexEther } from "@/lib/utils";
import { usePayRelayr } from "@/lib/relayr/hooks/usePayRelayr";
import { useGetRelayrBundle } from "@/lib/relayr/hooks/useGetRelayrBundle";
import { ExternalLink } from "@/components/ExternalLink";

const defaultStageData = {
  initialOperator: "", // only the first stage has this
  initialIssuance: "",

  priceCeilingIncreasePercentage: "",
  priceCeilingIncreaseFrequency: "",
  priceFloorTaxIntensity: "",

  premintTokenAmount: "",

  splitRate: "",
  boostDuration: "",
};

type RevnetFormData = {
  name: string;
  // tagline: string;
  description: string;
  logoUri?: string;

  tokenName: string;
  tokenSymbol: string;

  premintTokenAmount: string;
  stages: (typeof defaultStageData)[];
};

const DEFAULT_FORM_DATA: RevnetFormData = {
  name: "",
  // tagline: "",
  description: "",
  logoUri: "",

  tokenName: "",
  tokenSymbol: "",

  premintTokenAmount: "",

  stages: [],
};

const EXIT_TAX_HIGH = "80";
const EXIT_TAX_MID = "50";
const EXIT_TAX_LOW = "20";
const EXIT_TAX_NONE = "0";
/**
 * The contract addresses to use for deployment
 * @todo not ideal to hardcode these addresses
 */
const SUPPORTED_JB_MULTITERMINAL_ADDRESS = {
  "84532": "0x4DeF0AA5B9CA095d11705284221b2878731ab4EF" as Address,
  "421614": "0x4DeF0AA5B9CA095d11705284221b2878731ab4EF" as Address,
  "11155111": "0x4DeF0AA5B9CA095d11705284221b2878731ab4EF" as Address,
  "11155420": "0x4DeF0AA5B9CA095d11705284221b2878731ab4EF" as Address,
};

const SUPPORTED_JB_CONTROLLER_ADDRESS = {
  "84532": "0x219A5cE6d1c512D5b050ad2E3d380b8746BE0Cb8" as Address,
  "421614": "0x219A5cE6d1c512D5b050ad2E3d380b8746BE0Cb8" as Address,
  "11155111": "0x219A5cE6d1c512D5b050ad2E3d380b8746BE0Cb8" as Address,
  "11155420": "0x219A5cE6d1c512D5b050ad2E3d380b8746BE0Cb8" as Address,
};

function Field(props: FieldAttributes<any>) {
  if (props.suffix || props.prefix) {
    return (
      <div className="relative w-full">
        {props.prefix ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-zinc-500 sm:text-md">{props.prefix}</span>
          </div>
        ) : null}
        <FormikField
          {...props}
          className={twMerge(
            "flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-md ring-offset-white file:border-0 file:bg-transparent file:text-md file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300",
            props.prefix ? "pl-6" : "",
            props.className
          )}
        />
        {props.suffix ? (
          <div
            className={twMerge(
              "pointer-events-none absolute inset-y-0 right-0 flex items-center",
              props.type === "number" ? "pr-9" : "pr-3"
            )}
          >
            <span className="text-zinc-500 sm:text-md">{props.suffix}</span>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <FormikField
      {...props}
      className={twMerge(
        "flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-md ring-offset-white file:border-0 file:bg-transparent file:text-md file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300",
        props.className
      )}
    />
  );
}

function FieldGroup(
  props: FieldAttributes<any> & {
    label: string;
    description?: string | ReactNode;
    className?: string;
  }
) {
  return (
    <div className={twMerge("mb-5", props.className)}>
      <label
        htmlFor={props.name}
        className="block text-md font-semibold leading-6 mb-1"
      >
        {props.label}
      </label>
      {props.description ? (
        <p className="text-md text-zinc-600 mb-3">{props.description}</p>
      ) : null}
      <Field {...props} />
    </div>
  );
}

function DetailsPage() {
  const { setFieldValue, isSubmitting, isValid, initialErrors } =
    useFormikContext<RevnetFormData>();

  return (
    <>
      <FieldGroup id="name" name="name" label="Name" />
      <FieldGroup
        id="tokenSymbol"
        name="tokenSymbol"
        label="Ticker"
        placeholder="MOON"
        prefix="$"
      />
      <FieldGroup
        id="description"
        name="description"
        label="Description"
        component="textarea"
        rows={5}
        placeholder="What is your project about?"
      />
      <label
        className="block mb-2 text-md font-semibold text-gray-900 dark:text-white"
        htmlFor="file_input"
      >
        Upload logo
      </label>
      <IpfsImageUploader
        onUploadSuccess={(cid) => {
          setFieldValue("logoUri", ipfsUri(cid));
        }}
      />
    </>
  );
}

function NotesSection({ title = "[ ? ]", children }: { title?: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mt-4">
      {/* Dropdown Header */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 text-left text-zinc-600"
      >
        <span
          className={`transform transition-transform font-sm ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
        >
          ▶
        </span>
        <div className="font-sm">{title}</div>
      </button>

      {/* Dropdown Content */}
      {isOpen && <div className="mt-2 pl-4 text-gray-600 text-sm">{children}</div>}
    </div>
  );
}

function AddStageDialog({
  stageIdx,
  children,
  onSave,
  initialValues,
}: {
  stageIdx: number;
  initialValues?: typeof defaultStageData;
  children: React.ReactNode;
  onSave: (newStage: typeof defaultStageData) => void;
}) {
  const { values } = useFormikContext<RevnetFormData>();

  const [open, setOpen] = useState(false);
  const nativeTokenSymbol = useNativeTokenSymbol();

  const revnetTokenSymbol =
    values.tokenSymbol?.length > 0 ? `$${values.tokenSymbol}` : "tokens";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add stage</DialogTitle>
        </DialogHeader>
        <div className="my-8">
          <Formik
            initialValues={{ ...(initialValues ?? defaultStageData) }}
            onSubmit={(newValues) => {
              onSave(newValues);
              setOpen(false);
            }}
          >
            {() => (
              <Form>
                <div className="pb-7">
                  <FieldGroup
                    id="boostDuration"
                    name="boostDuration"
                    label="1. Stage duration"
                    suffix="days"
                    description="How long will this stage last? Leave blank to make it last forever."
                    type="number"
                  />
                </div>
                <div className="pb-10">
                  <FieldGroup
                    id="initialIssuance"
                    name="initialIssuance"
                    label="2. Issuance"
                    description={`How many ${revnetTokenSymbol} to mint when the revnet receives 1 ${nativeTokenSymbol}.`}
                    suffix={`${revnetTokenSymbol} / ${nativeTokenSymbol}`}
                    type="number"
                  />

                  <div>
                    <div className="flex gap-2 items-center text-md text-zinc-600">
                      <label
                        htmlFor="priceCeilingIncreasePercentage"
                        className="whitespace-nowrap"
                      >
                        ... decreasing by
                      </label>
                      <Field
                        id="priceCeilingIncreasePercentage"
                        name="priceCeilingIncreasePercentage"
                        className="h-9"
                        suffix="%"
                        required
                      />
                      <label htmlFor="priceCeilingIncreaseFrequency">
                        every
                      </label>
                      <Field
                        id="priceCeilingIncreaseFrequency"
                        name="priceCeilingIncreaseFrequency"
                        className="h-9"
                        type="number"
                        required
                      />
                      days.
                    </div>
                    <NotesSection>

                    <div className="text-zinc-600 text-md mt-4">
                      <span className="italic">
                        <ul className="list-disc list-inside">
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
Days must be a multiple of this stage's duration.
    </div>
  </li>
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
      Decreasing 50% means to double the price – a halvening effect.
    </div>
  </li>
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
      If there's a Uniswap pool for {revnetTokenSymbol} / {nativeTokenSymbol} offering a better price, all {nativeTokenSymbol} paid
      in will be used to buyback instead of feeding the revnet.
    </div>
  </li>
                        </ul>
                        </span>
                    </div>
                    </NotesSection>
                  </div>
                </div>

                <div className="pb-10">
                  <div
                    className="block text-md font-semibold leading-6"
                  >
                    3. Split
                  </div>
                  <p className="text-zinc-600 text-md pb-3 mt-1">
                    Split a portion of new token issuance and buybacks to an operator.
                  </p>

                  <FieldGroup
                    className="flex-1"
                    id="splitRate"
                    name="splitRate"
                    suffix={`% of ${revnetTokenSymbol}`}
                  />
                  <div className="flex gap-2 items-center text-md text-zinc-600">
                    <label
                      htmlFor="priceCeilingIncreasePercentage"
                      className="whitespace-nowrap"
                    >
                      ... operated by
                    </label>
                  <Field
                    id="initialOperator"
                    name="initialOperator"
                    placeholder="0x"
                    description={
                      stageIdx === 0 ? "" : (
                        <span className="text-xs text-blue-900 mb-2 flex gap-1 p-2 bg-blue-50 rounded-md">
                          [ ? ]
                          {/* <QuestionMarkCircleIcon className="h-4 w-4" />  */}
                          Set the
                          operator in the first stage.
                        </span>
                      )
                    }
                    disabled={stageIdx > 0}
                    required
                  />
                  .
                  </div>

                    <NotesSection>

                    <div className="text-zinc-600 text-md mt-4">
                      <span className="italic">
                        <ul className="list-disc list-inside">
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
    The operator can change the distribution of the split to new destinations at any time.
    </div>
    <span className="mr-2">•</span>
    <div>
    The operator can be a multisig, a DAO, an LLC, a core team, an
                    airdrop stockpile, a staking rewards contract, or some other
                    address.
    </div>
  </li>
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
    The operator is set once and is not bound by stages. The operator can hand off this responsibility to another address at any time, or relinquish it altogether.
    </div>
  </li>
                        </ul>
                        </span>
                    </div>
                    </NotesSection>

                </div>

                  <div className="pb-8">
                      <FieldGroup
                        className="flex-1"
                        id="premintTokenAmount"
                        name="premintTokenAmount"
                        label="4. Automint"
                        description="Automatically mint tokens for the Operator when this stage becomes active."
                        suffix={revnetTokenSymbol || "tokens"}
                      />
                  </div>
                  <div className="pb-10">
                    <div
                      id="priceFloorTaxIntensity-group"
                      className="block text-md font-semibold leading-6"
                    >
                      5. Cash out tax
                    </div>
                    <p className="text-md text-zinc-500 mt-3">
                      All {revnetTokenSymbol} holders can access revenue by cashing out their {revnetTokenSymbol}. A
                      tax can be added that rewards {revnetTokenSymbol} holders who stick around while others cash out.
                    </p>
                    <div
                      role="group"
                      aria-labelledby="priceFloorTaxIntensity-group"
                      className="flex gap-3 text-md mt-4"
                    >
                      <label>
                        <FormikField
                          type="radio"
                          name="priceFloorTaxIntensity"
                          value={EXIT_TAX_NONE}
                          className="mr-1"
                        />
                        None (0)
                      </label>
                      <label>
                        <FormikField
                          type="radio"
                          name="priceFloorTaxIntensity"
                          value={EXIT_TAX_LOW}
                          className="mr-1"
                        />
                        Low (0.2)
                      </label>
                      <label>
                        <FormikField
                          type="radio"
                          name="priceFloorTaxIntensity"
                          value={EXIT_TAX_MID}
                          className="mr-1"
                        />
                        Mid (0.5)
                      </label>
                      <label>
                        <FormikField
                          type="radio"
                          name="priceFloorTaxIntensity"
                          value={EXIT_TAX_HIGH}
                          className="mr-1"
                        />
                        High (0.8)
                      </label>
                  </div>

                    <NotesSection>

                    <div className="text-zinc-600 text-md mt-4">
                      <span className="italic">
                        <ul className="list-disc list-inside">
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
    The higher the tax, the less that can be accessed by cashing out at any given time, and the more that is left to share between remaining holders who cash out later.
    </div>
  </li>
                          <li className="flex">
    <span className="mr-2">•</span>
    <div>
    Given 100 {nativeTokenSymbol} in the revnet, 100 total supply of {revnetTokenSymbol}, and 10 {revnetTokenSymbol} being cashed out, a tax rate of 0 would yield a cash out value of 10 {nativeTokenSymbol}, 0.2 would yield 8.2 {nativeTokenSymbol}, 0.5 would yield 5.5 {nativeTokenSymbol}, and 0.8 would yield 2.8 {nativeTokenSymbol}.
    </div>
  </li>
  <li className="flex">
    <span className="mr-2">•</span>
    <div>
    The formula for the amount of {nativeTokenSymbol} received when cashing out is `(ax/s) * ((1-r) + xr/s)` where: `r` is the cash out tax rate, `a` is the amount in the revnet being accessed, `s` is the current token supply of {revnetTokenSymbol}, `x` is the amount of {revnetTokenSymbol} being cashed out.
    </div>
  </li>
                        </ul>
                        </span>
                </div>
                    </NotesSection>
                  </div>

                <DialogFooter>
                  <Button type="submit">Save stage</Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfigPage() {
  const { values, setFieldValue } = useFormikContext<RevnetFormData>();
  const nativeTokenSymbol = useNativeTokenSymbol();

  const hasStages = values.stages.length > 0;
  const lastStageHasDuration = Boolean(
    values.stages[values.stages.length - 1]?.boostDuration
  );

  const maxStageReached = values.stages.length >= MAX_RULESET_COUNT;
  const canAddStage = !hasStages || (lastStageHasDuration && !maxStageReached);

  return (
    <>
      <FieldArray
        name="stages"
        render={(arrayHelpers) => (
          <div>
            {values.stages.length > 0 ? (
              <div className="divide-y mb-2">
                {values.stages.map((stage, index) => (
                  <div className="py-4" key={index}>
                    <div className="mb-1 flex justify-between items-center">
                      <div className="font-semibold">Stage {index + 1}</div>
                      <div className="flex">
                        <AddStageDialog
                          stageIdx={index}
                          initialValues={stage}
                          onSave={(newStage) => {
                            arrayHelpers.replace(index, newStage);
                            setFieldValue(
                              "premintTokenAmount",
                              newStage.premintTokenAmount
                            );
                          }}
                        >
                          <Button variant="ghost" size="sm">
                            <PencilSquareIcon className="h-4 w-4" />
                          </Button>
                        </AddStageDialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => arrayHelpers.remove(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-md text-zinc-500 flex gap-2 flex-wrap">
                      <div>
                        {stage.boostDuration ? (
                          <>{stage.boostDuration} days</>
                        ) : (
                          "Forever"
                        )}{" "}
                      </div>
                      •
                      <div>
                        {stage.initialIssuance} {values.tokenSymbol ?? "tokens"}{" "}
                        / {nativeTokenSymbol}
                        {", "}-{stage.priceCeilingIncreasePercentage || 0}%
                        every {stage.priceCeilingIncreaseFrequency} days
                      </div>
                      •<div>{(stage.priceFloorTaxIntensity || 0)/100} cash out tax rate</div>
                      <div>• {stage.splitRate || 0}% operator split</div>
                      <div>• {stage.premintTokenAmount || 0} automint</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-left text-black-500 mb-4 font-semibold">
                Add a stage to get started
              </div>
            )}

            <AddStageDialog
              stageIdx={values.stages.length}
              onSave={(newStage) => {
                arrayHelpers.push(newStage);
                setFieldValue(
                  "premintTokenAmount",
                  newStage.premintTokenAmount
                );
              }}
            >
              <Button
                className="w-full flex gap-1 border border-dashed border-zinc-400"
                variant="secondary"
                disabled={!canAddStage}
              >
                Add stage <PlusIcon className="h-3 w-3" />
              </Button>
            </AddStageDialog>
            {maxStageReached ? (
              <div className="text-md text-orange-900 mt-2 flex gap-1 p-2 bg-orange-50 rounded-md">
                <ExclamationCircleIcon className="h-4 w-4" /> You've added the
                maximum number of stages.
              </div>
            ) : !canAddStage ? (
              <div className="text-md text-orange-900 mt-2 flex gap-1 p-2 bg-orange-50 rounded-md">
                <ExclamationCircleIcon className="h-4 w-4" /> Your last stage is
                indefinite. Set a duration to add another stage.
              </div>
            ) : null}
          </div>
        )}
      />
    </>
  );
}

function ReviewPage() {
  const { values } = useFormikContext<RevnetFormData>();

  return (
    <div>
      <h2 className="text-2xl font-medium mb-7">3. Review and deploy</h2>

      <div className="mb-5">
        <div className="px-4 sm:px-0">
          <h3 className="font-medium">General</h3>
        </div>

        <div className="mt-6 border-t border-zinc-100">
          <dl className="divide-y divide-zinc-100">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-md font-medium leading-6 text-zinc-900">
                Revnet name
              </dt>
              <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {values.name}
              </dd>
            </div>
            {/* <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-md font-medium leading-6 text-zinc-900">
                Revnet tagline
              </dt>
              <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {values.tagline}
              </dd>
            </div> */}
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-md font-medium leading-6 text-zinc-900">
                Revnet description
              </dt>
              <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {values.description.split("\n").map((d, idx) => (
                  <p
                    className={
                      idx < values.description.length - 1 ? "" : "mb-3"
                    }
                    key={idx}
                  >
                    {d}
                  </p>
                ))}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-md font-medium leading-6 text-zinc-900">
                Logo
              </dt>

              <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {values.logoUri ? (
                  <Image
                    src={ipfsUriToGatewayUrl(values.logoUri)}
                    alt="Revnet logo"
                    width={80}
                    height={200}
                  />
                ) : (
                  "None"
                )}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-md font-medium leading-6 text-zinc-900">
                Token
              </dt>
              <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {values.tokenName} (${values.tokenSymbol})
              </dd>
            </div>
          </dl>
        </div>
        <div className="pt-5">
          <h3 className="mb-1 font-medium">Stages</h3>

          <dl>
            {values.stages.map((stage, idx) => {
              return (
                <div key={idx} className="py-6">
                  <div className="text-md font-medium mb-3 uppercase flex gap-3 items-center">
                    <span className="flex-shrink-0">Stage {idx + 1}</span>
                    <span className="h-[1px] w-full bg-zinc-100"></span>
                  </div>

                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-md font-medium leading-6 text-zinc-900">
                      Duration
                    </dt>
                    <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                      {stage.boostDuration ? (
                        <>{stage.boostDuration} days</>
                      ) : (
                        "Forever"
                      )}
                    </dd>
                  </div>

                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-md font-medium leading-6 text-zinc-900">
                      Token price ceiling
                    </dt>
                    <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                      +{stage.priceCeilingIncreasePercentage || 0}% every{" "}
                      {stage.priceCeilingIncreaseFrequency} days
                    </dd>
                  </div>

                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-md font-medium leading-6 text-zinc-900">
                      Cash out tax
                    </dt>
                    <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                      {stage.priceFloorTaxIntensity}%
                    </dd>
                  </div>

                  <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-md font-medium leading-6 text-zinc-900">
                      Operator split
                    </dt>
                    <dd className="mt-1 text-md leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                      {stage.splitRate || 0}%{" "}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

function EnvironmentCheckbox({ relayrResponse }: { relayrResponse?: RelayrAPIResponse }) {
  // State for dropdown selection
  const [environment, setEnvironment] = useState("production");
  const { pay } = usePayRelayr();
  const { submitForm, values } = useFormikContext<RevnetFormData>();
  const { startPolling, response: bundleResponse, isComplete } = useGetRelayrBundle();

  const isFormValid = () => {
    if (!values.name || !values.tokenSymbol || !values.description) {
      return false;
    }

    if (!values.stages || values.stages.length === 0) {
      return false;
    }

    const isStagesValid = values.stages.every((stage) => {
      return (
        stage.initialIssuance &&
        stage.priceCeilingIncreasePercentage &&
        stage.priceCeilingIncreaseFrequency &&
        (values.stages.indexOf(stage) === 0 ? stage.initialOperator : true)
      );
    });

    return isStagesValid;
  };

  // Handler for dropdown change
  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(e.target.value);
  };

  return (

    <div className="dropdown-check-array md:col-span-2">
      <div className="text-left text-black-500 mb-4 font-semibold">
        Choose your chains
      </div>
    <div className="flex flex-col gap-4">
      <select
        id="env-dropdown"
        value={environment}
        onChange={handleEnvironmentChange}
        className="p-2 rounded border border-gray-300 text-black-600"
      >
        <option value="production">Production</option>
        <option value="testing">Testing</option>
      </select>

      {/* Conditional Checkboxes */}
      <div className="flex flex-wrap gap-6 mt-4">
        {environment === "production" ? (
          // Production Options
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="ethereum" className="form-checkbox" /> Ethereum Mainnet
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="optimism" className="form-checkbox" /> Optimism Mainnet
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="arbitrum" className="form-checkbox" /> Arbitrum Mainnet
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="base" className="form-checkbox" /> Base Mainnet
            </label>
          </>
        ) : (
          // Testnet Options (Sepolia)
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="sepolia-ethereum" className="form-checkbox" /> Ethereum Sepolia
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="sepolia-optimism" className="form-checkbox" /> Optimism Sepolia
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="sepolia-arbitrum" className="form-checkbox" /> Arbitrum Sepolia
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" value="sepolia-base" className="form-checkbox" /> Base Sepolia
            </label>
          </>
        )}
      </div>

      <div className="flex md:col-span-3 mt-4">
        <Button
          type="submit"
          size="lg"
          disabled={!isFormValid() || !!relayrResponse?.bundle_uuid}
          className="text-color-black bg-transparent border border-black hover:bg-zinc-100"
          onClick={() => {
            submitForm();
          }}
        >
          Get Quote <FastForwardIcon className="h-4 w-4 fill-transparent ml-2" />
        </Button>
      </div>

      {relayrResponse && (
        <>
          <div className="text-left text-black-500 mt-4 font-semibold">
            Deploying this revnet will cost {formatHexEther(relayrResponse.payment_info?.[0]?.amount)} ETH. How would you like to pay?
          </div>
          <select
            id="env-dropdown"
            value={environment}
            onChange={handleEnvironmentChange}
            className="p-2 rounded border border-gray-300 text-black-600"
          >
            { relayrResponse.payment_info.map((po) => {
              return (
                <option value={po.chain} key={po.chain}>{chainIdMap[po.chain]}</option>
              )
            })}
          </select>
          <div className="flex md:col-span-3 mt-4">
            <Button
              type="submit"
              size="lg"
              onClick={() => {
                pay?.(relayrResponse.payment_info[0])
                startPolling(relayrResponse.bundle_uuid);
              }}
            >
              Finalize <FastForwardIcon className="h-4 w-4 fill-white ml-2" />
            </Button>
          </div>
          {!!bundleResponse && (
            <div className="flex flex-col space-y-2">
              {bundleResponse.transactions.map((txn) => {
                return txn?.status?.data?.hash ?
                  <EtherscanLink
                    value={txn?.status?.data?.hash}
                    type="tx"
                    chain={ChainIdToChain[txn.request.chain as JBChainId]}
                    key={txn?.tx_uuid}
                  >
                    {chainNames[txn.request.chain as JBChainId]} {txn?.status?.data?.hash}
                  </EtherscanLink> : null
              })}
            </div>
          )}
        </>
        // if (isSuccess && txData) {
        //   console.log("useDeployRevnet::tx success", txData.logs);
        //   const projectIdHex = txData.logs[0].topics[1];
        //   if (!projectIdHex) {
        //     console.warn("useDeployRevnet::fail::no project id");

        //     return (
        //       <div className="container">
        //         <div className="max-w-lg rounded-lg shadow-lg my-24 p-10 mx-auto border border-zinc-100">
        //           Something went wrong.{" "}
        //           <EtherscanLink type="tx" value={data}>
        //             Check the transaction on Etherscan
        //           </EtherscanLink>
        //           .
        //         </div>
        //       </div>
        //     );
        //   }

        //   const projectId = BigInt(projectIdHex).toString(10);
        //   console.warn("useDeployRevnet::success::project id", projectId);

        //   const chainId = chain?.id ?? sepolia.id;

        //   return (
        //     <>
        //       <Nav />
        //       <div className="container min-h-screen">
        //         <div className="max-w-lg rounded-lg shadow-lg my-24 p-10 mx-auto border border-zinc-100 flex flex-col items-center">
        //           <CheckCircleIcon className="h-9 w-9 text-green-600 mb-4" />
        //           <h1 className="text-4xl mb-10">Your Revnet is Live</h1>
        //           <p>
        //             <Link href={`sepolia/${projectId}`}>
        //               <Button size="lg">Go to Revnet</Button>
        //             </Link>
        //           </p>
        //         </div>
        //       </div>
        //     </>
        //   );
        // }
      )}
      </div>
    </div>
  );
}

function DeployRevnetForm({ relayrResponse }: { relayrResponse?: RelayrAPIResponse }) {
  const { values } = useFormikContext<RevnetFormData>();

  const revnetTokenSymbol =
    values.tokenSymbol?.length > 0 ? `$${values.tokenSymbol}` : "tokens";

  const nativeTokenSymbol = useNativeTokenSymbol();
  return (
    <div className="grid md:grid-cols-3 max-w-6xl mx-auto my-20 gap-x-6 gap-y-6 md:gap-y-0 md:px-0 px-5">
      <h1 className="mb-16 text-2xl md:col-span-3 font-semibold">
        Deploy a revnet for your project
      </h1>
      <div className="md:col-span-1">
        <h2 className="font-medium text-lg mb-2">1. Aesthetics</h2>
        <p className="text-zinc-600 text-md">
          Your revnet's look and feel.
        </p>
      </div>
      <div className="md:col-span-2">
        <DetailsPage />
      </div>

      <div className="h-[1px] bg-zinc-200 md:col-span-3 my-10"></div>

      <div className="md:col-span-1">
        <h2 className="font-medium text-lg mb-2">2. Rules</h2>
        <p className="text-zinc-600 text-md">
          Your revnet's monetization rules evolve over time automatically in stages.
        </p>
        <p className="text-zinc-600 text-md mt-2">
          Staged rules
          are an onchain contract that can't be edited once deployed.
        </p>
      </div>
      <div className="md:col-span-2">
        <ConfigPage />
      </div>
      <div className="h-[1px] bg-zinc-200 md:col-span-3 my-10"></div>
      <div className="md:col-span-1">
        <h2 className="font-medium text-lg mb-2">3. Deploy</h2>
        <p className="text-zinc-600 text-md">
          Pick which chains your revnet will accept money on and issue {revnetTokenSymbol} from.
        </p>
        <p className="text-zinc-600 text-md mt-2">
          Holder of {revnetTokenSymbol} can cash out on any of the selected chains, and can move their {revnetTokenSymbol} between chains at any time.
        </p>
        <p className="text-zinc-600 text-md mt-2">
          The Operator you set in your revnet's rules will also be able to add new chains to the revnet later.
        </p>
      </div>
      <EnvironmentCheckbox relayrResponse={relayrResponse} />
    </div>
  );
}

function parseDeployData(
  formData: RevnetFormData,
  extra: {
    metadataCid: string;
    chainId: Chain["id"] | undefined;
  }
): ContractFunctionParameters<
  typeof revDeployerAbi,
  "nonpayable",
  "deployFor"
>["args"] {
  const now = Math.floor(Date.now() / 1000);

  let cumStart = 0;
  const stageConfigurations = formData.stages.map((stage, idx) => {
    const prevStageDuration =
      idx === 0 ? now : Number(formData.stages[idx - 1].boostDuration) * 86400; // days to seconds
    const startsAtOrAfter = cumStart + prevStageDuration;
    cumStart += prevStageDuration;

    return {
      startsAtOrAfter,
      /**
       * REVAutoMint[]
       *
       * @see https://github.com/rev-net/revnet-core/blob/main/src/structs/REVAutoMint.sol
       */
      autoMints: [
        {
          chainId: extra.chainId ?? mainnet.id,
          count: parseUnits(stage.premintTokenAmount, 18),
          beneficiary: stage.initialOperator.trim() as Address,
        },
      ],
      splitPercent:
        Number(ReservedPercent.parse(stage.splitRate, 4).value) / 100,
      initialIssuance:
        stage.initialIssuance && stage.initialIssuance !== ""
          ? parseUnits(`${stage.initialIssuance}`, 18)
          : 0n,
      issuanceDecayFrequency:
        Number(stage.priceCeilingIncreaseFrequency) * 86400, // seconds
      issuanceDecayPercent:
        Number(
          DecayPercent.parse(stage.priceCeilingIncreasePercentage, 9).value
        ) / 100,
      cashOutTaxRate:
        Number(RedemptionRate.parse(stage.priceFloorTaxIntensity, 4).value) /
        100, //
      extraMetadata: 0, // ??
    };
  });

  return [
    0n, // 0 for a new revnet
    {
      description: {
        name: formData.name,
        ticker: formData.tokenSymbol,
        uri: extra.metadataCid,
        salt: createSalt(),
      },
      baseCurrency: Number(BigInt(NATIVE_TOKEN)),
      splitOperator:
        (formData.stages[0]?.initialOperator.trim() as Address) ?? zeroAddress,
      stageConfigurations,
      allowCrosschainSuckerExtension: true,
      loans: zeroAddress,
      loanSources: [],
    },
    [
      {
        terminal: SUPPORTED_JB_MULTITERMINAL_ADDRESS[sepolia.id],
        accountingContextsToAccept: [
          {
            token: NATIVE_TOKEN,
            decimals: NATIVE_TOKEN_DECIMALS,
            currency: Number(BigInt(NATIVE_TOKEN)), // ETH
          },
        ],
      },
    ],
    {
      hook: zeroAddress,
      poolConfigurations: [
        {
          token: NATIVE_TOKEN,
          fee: 0,
          twapSlippageTolerance: 0,
          twapWindow: 0,
        },
      ],
    },
    {
      deployerConfigurations: [],
      salt: createSalt(),
    },
  ];
}

async function pinProjectMetadata(metadata: JBProjectMetadata) {
  const { Hash } = await fetch("/api/ipfs/pinJson", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  }).then((res) => res.json());

  return Hash;
}

export default function Page() {
  const [isLoadingIpfs, setIsLoadingIpfs] = useState<boolean>(false);

  const chain = useChain();
  const { write, response } = useDeployRevnetRelay();
  // const { data: txData, isSuccess } = useWaitForTransactionReceipt({
  //   hash: data,
  // });
  async function deployProject(formData: RevnetFormData) {
    // Upload metadata
    setIsLoadingIpfs(true);
    const metadataCid = await pinProjectMetadata({
      name: formData.name,
      // projectTagline: formData.tagline,
      description: formData.description,
      logoUri: formData.logoUri,
    });
    setIsLoadingIpfs(false);

    const deployData = parseDeployData(formData, {
      metadataCid,
      chainId: chain?.id,
    });

    const encodedData = encodeFunctionData({
      abi: revDeployerAbi, // ABI of the contract
      functionName: "deployFor",
      args: deployData,
    });

    console.log("deployData::", deployData, encodedData);

    // Send to Relayr
    write?.({
      data: encodedData,
      chainDeployer: Object.entries(SUPPORTED_JB_CONTROLLER_ADDRESS).map(([chain, terminal]) => {
        return {
          chain: Number(chain),
          deployer: "0x25bC5D5A708c2E426eF3a5196cc18dE6b2d5A3d1" // TODO
        }
      })
    });
  }

  return (
    <>
      <Nav />

      <Formik
        initialValues={DEFAULT_FORM_DATA}
        onSubmit={(formData: RevnetFormData) => {
          try {
            deployProject?.(formData);
          } catch (e) {
            setIsLoadingIpfs(false);
            console.error(e);
          }
        }}
      >
        <DeployRevnetForm relayrResponse={response} />
      </Formik>
    </>
  );
}
