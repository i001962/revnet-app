import { useFormikContext } from "formik";
import { RevnetFormData } from "../types";
import { FieldGroup } from "./Fields";
import { IpfsImageUploader } from "@/components/IpfsFileUploader";
import { ipfsUri } from "@/lib/ipfs";

export function DetailsPage({
  disabled = false
}: {
  disabled?: boolean
}) {
  const { setFieldValue } =
    useFormikContext<RevnetFormData>();

  return (
    <>
      <div> 
        <h1 className="mb-8 text-3xl md:col-span-3 font-semibold text-notWhite dark:text-white">
         Deployer
        </h1>
        <h2 className="font-bold text-lg mb-2 text-notWhite">1. Token info</h2>

        <div className="grid grid-cols-1 md:grid-cols-[4fr_1fr_2fr] sm:gap-6">
          <FieldGroup id="name" name="name" label="Name" disabled={disabled} className="bg-darkPurple text-lightPurple"/>
          <FieldGroup
            id="tokenSymbol"
            name="tokenSymbol"
            label="Ticker"
            placeholder="MOON"
            prefix="$"
            disabled={disabled}
            className="max-w-lg bg-darkPurple text-lightPurple"
            />
          <div>
            <label
              className="block mb-1 text-md font-semibold text-lightPurple dark:text-white bg-darkPurple"
              htmlFor="file_input"
            >
                Logo
            </label>
            <IpfsImageUploader
              onUploadSuccess={(cid) => {
                setFieldValue("logoUri", ipfsUri(cid));
              }}
              disabled={disabled}
            />
          </div>
        </div>
        <FieldGroup
          id="description"
          name="description"
          label="Description"
          component="textarea"
          rows={2}
          className="max-w-lg bg-darkPurple text-lightPurple"
          placeholder="What is your project about?"
          disabled={disabled}
        />
      </div>
    </>
  );

}