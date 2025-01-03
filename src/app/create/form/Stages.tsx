import { FieldArray, useFormikContext } from "formik";
import {
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useNativeTokenSymbol } from "@/hooks/useNativeTokenSymbol";
import { MAX_RULESET_COUNT } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/solid";
import { RevnetFormData } from "../types";
import { AddStageDialog } from "./AddStageDialog";

export function Stages({
  disabled = false
}: {
  disabled?: boolean
}) {
  const { values, setFieldValue } = useFormikContext<RevnetFormData>();
  const nativeTokenSymbol = useNativeTokenSymbol();

  const hasStages = values.stages.length > 0;
  const lastStageHasDuration = Boolean(
    values.stages[values.stages.length - 1]?.boostDuration
  );

  const revnetTokenSymbolCapitalized =
    values.tokenSymbol?.length > 0 ? `$${values.tokenSymbol}` : "Token";

  const maxStageReached = values.stages.length >= MAX_RULESET_COUNT;
  const canAddStage = !hasStages || (lastStageHasDuration && !maxStageReached);
  return (
    <>
      <div className="md:col-span-4">
        <h2 className="font-bold text-notWhite text-lg mb-2 mt-4">2. Set rules</h2>
        <p className="text-lightPurple">
          {revnetTokenSymbolCapitalized} issuance and cash out rules evolve over
          time automatically in stages.
        </p>
        <p className="text-lightPurple mt-2">
          Staged rules can't be edited once deployed.
        </p>
      </div>
      <FieldArray
        name="stages"
        render={(arrayHelpers) => (
          <div className="mb-4 col-span-2">
            {values.stages.length > 0 ? (
              <div className="divide-y mt-4 mb-2 bg-purplePanel p-4 rounded">
                {values.stages.map((stage, index) => (
                  <div className="py-2" key={index}>
                    <div className="mb-1 flex justify-between items-center bg-purplePanel rounded">
                      <div className="font-semibold text-limeGreenOpacity">Stage {index + 1}</div>
                      <div className="flex bg-purplePanel ml-8">
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
                    <Button variant="ghost" size="sm" disabled={disabled}>
                      <PencilSquareIcon className="h-4 w-4 text-limeGreenOpacity" />
                    </Button>
                  </AddStageDialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => arrayHelpers.remove(index)}
                  >
                    <TrashIcon className="h-4 w-4 text-limeGreenOpacity" />
                  </Button>
                </div>
              </div>
              <div className="text-md text-fontRed flex flex-col gap-2">
                <div>
                  {stage.boostDuration ? (
                    <>{stage.boostDuration} days</>
                  ) : (
                    "Forever"
                  )}{" "}
                </div>
                <div className="flex gap-1">
                  •
                  <div>
                    {stage.initialIssuance} {values.tokenSymbol ?? "tokens"}{" "}
                    / {nativeTokenSymbol}
                    {", "}-{stage.priceCeilingIncreasePercentage || 0}%
                    every {stage.priceCeilingIncreaseFrequency} days
                  </div>
                </div>
                  <div>• {(Number(stage.priceFloorTaxIntensity) || 0) / 100} cash
                    out tax rate
                  </div>
                <div>• {stage.splitRate || 0}% operator split</div>
                <div>• {stage.premintTokenAmount || 0} auto issuance</div>
              </div>
              </div>
          ))}
        </div>
      ) : (
        <div className="text-left text-notWhite font-semibold mb-4 mt-2">
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
          className="flex gap-1 bg-deepPink text-lightPurple rounded bg-clip-padding px-3 py-[0.32rem] hover:bg-darkPink"
          variant="secondary"
          disabled={!canAddStage || disabled}
        >
          Add stage <PlusIcon className="h-3 w-3" />
        </Button>
      </AddStageDialog>
      {maxStageReached ? (
        <div className="text-md text-fontRed mt-2 flex gap-1 p-2 bg-lightPurple">
          <ExclamationCircleIcon className="h-4 w-4" /> You've added the
          maximum number of stages.
        </div>
      ) : !canAddStage ? (
        <div className="text-md text-deepPink mt-2 flex gap-1 p-2 bg-lightPurple">
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
