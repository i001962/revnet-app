import { useFormikContext, FieldArray } from "formik";
import { RevnetFormData } from "../types";
import { ChainLogo } from "@/components/ChainLogo";
import { JB_CHAINS } from "juice-sdk-core";
import { Field } from "./Fields";
import { sortChains } from "@/lib/utils";

export function ChainOperator({ disabled = false }: { disabled?: boolean }) {
  const { values } = useFormikContext<RevnetFormData>();
  return (
    <>
      <h2 className="text-left text-black-500 mb-4 font-semibold">
        Operator
      </h2>
      <FieldArray
        name="operator"
        render={() => (
          <div className="mb-8">
            <div className="text-sm text-zinc-500 mb-4">
              Confirm the operator's address for each chain. Operators can re-route splits within the split limit of each stage, edit the name, logo, and description of the revnet, and deploy the revnet to new chains later on.
            </div>
            <div className="flex mb-2 text-sm font-semibold text-zinc-500">
              <div className="w-48">Chain</div>
              <div>Address</div>
            </div>
            {sortChains(values.chainIds).map((chain, chainIndex) => (
              <div key={chainIndex} className="flex items-center text-md text-zinc-600 mt-4">
                <div className="flex gap-2 items-center w-48 text-sm">
                  <ChainLogo chainId={chain} width={25} height={25} />
                  <div className="text-zinc-400">{JB_CHAINS[chain].name}</div>
                </div>
                <Field
                  id={`operator.${chainIndex}.address`}
                  name={`operator.${chainIndex}.address`}
                  defaultValue={values.stages[0]?.initialOperator}
                  className="h-9 w-3/5"
                  placeholder="0x"
                  disabled={disabled}
                  required
                />
                <Field
                  type="hidden"
                  name={`operator.${chainIndex}.chainId`}
                  value={chain}
                />
              </div>
            ))}
          </div>
        )}
      />
    </>
  )
}
