import * as React from "react";

import { cn } from "@/lib/utils";
import { PayOnSelect } from "./PayOnSelect";

export interface PayInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  withPayOnSelect?: boolean;
  currency?: React.ReactNode;
  inputClassName?: string;
}

const PayInput = React.forwardRef<HTMLInputElement, PayInputProps>(
  (
    {
      className,
      inputClassName,
      label,
      type,
      currency,
      withPayOnSelect,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "h-30 flex w-full items-center justify-between bg-zinc-100 px-4 py-4 shadow-sm focus-within:ring-1 focus-within:ring-inset focus-within:ring-zinc-500",
          className,
        )}
      >
        <div className="flex flex-col">
          <div className="flex flex-row gap-1">
            <label className="text-md text-black-700">{label}</label>
            {withPayOnSelect && <PayOnSelect />}
          </div>
          <input
            type={type}
            className={cn(
              "w-full border-0 bg-transparent pb-0 pl-0 pr-3 pt-1 text-2xl text-zinc-900 placeholder:text-zinc-400 focus:ring-0 sm:leading-6",
              inputClassName,
            )}
            ref={ref}
            placeholder="0.00"
            {...props}
          />
        </div>
        {currency ? (
          typeof currency === "string" ? (
            <span className="select-none text-right text-lg">{currency}</span>
          ) : (
            <div className="text-right text-lg">{currency}</div>
          )
        ) : null}
      </div>
    );
  },
);
PayInput.displayName = "PayInput";

export { PayInput };
